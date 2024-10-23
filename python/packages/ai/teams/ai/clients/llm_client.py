"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from logging import Logger
from typing import Any, List, Optional, Union

from botbuilder.core import TurnContext

from ...state import Memory, MemoryBase
from ...streaming.prompt_chunk import PromptChunk
from ...streaming.streaming_response import StreamingResponse
from ..models import PromptCompletionModel, PromptResponse, ResponseReceivedHandler, StreamingEventTypes
from ..prompts import (
    ConversationHistorySection,
    Message,
    Prompt,
    PromptFunctions,
    PromptTemplate,
)
from ..tokenizers import Tokenizer
from ..validators import DefaultResponseValidator, PromptResponseValidator


@dataclass
class LLMClientOptions:
    """
    Options for an LLMClient instance.
    """

    model: PromptCompletionModel
    "AI model to use for completing prompts."

    history_variable: str = "conversation.history"
    """
    Optional. Memory variable used for storing conversation history.
    Defaults to `conversation.history`
    """

    input_variable: str = "temp.input"
    """
    Optional. Memory variable used for storing the users input message.
    Defaults to `temp.input`
    """

    max_history_messages: int = 10
    """
    Optional. Maximum number of conversation history messages to maintain.
    Defaults to `10`
    """

    max_repair_attempts: int = 3
    """
    Optional. Maximum number of automatic repair attempts the LLMClient instance will make.
    Defaults to `3`
    """

    validator: PromptResponseValidator = field(default_factory=DefaultResponseValidator)
    """
    Optional. Response validator to use when completing prompts.
    Defaults to `DefaultResponseValidator`
    """

    logger: Optional[Logger] = None
    """
    Optional. When set the model will log requests
    """

    start_streaming_message: Optional[str] = ""
    """
    Optional message to send a client at the start of a streaming response.
    """

    end_stream_handler: Optional[ResponseReceivedHandler] = None
    """
    Optional handler to run when a stream is about to conclude.
    """


class LLMClient:
    """
    LLMClient class that's used to complete prompts.
    """

    _options: LLMClientOptions
    _start_streaming_message: Optional[str] = ""
    _end_stream_handler: Optional[ResponseReceivedHandler] = None

    @property
    def options(self) -> LLMClientOptions:
        return self._options

    def __init__(self, options: LLMClientOptions) -> None:
        """
        Creates a new `LLMClient` instance.

        Args:
            options (LLMClientOptions): Options to configure the instance with.
        """

        self._options = options

    async def complete_prompt(
        self,
        context: TurnContext,
        memory: MemoryBase,
        functions: PromptFunctions,
        tokenizer: Tokenizer,
        template: PromptTemplate,
        remaining_attempts: Optional[int] = None,
    ) -> PromptResponse[str]:
        """
        Completes a prompt.

        Args:
            content (TurnContext): The turn context.
            memory (MemoryBase): An interface for accessing state values.
            functions (PromptFunctions): Functions to use when rendering the prompt.
            tokenizer (Tokenizer): Tokenizer used when rendering the prompt or counting tokens.
            template (PromptTemplate): Prompt used for the conversation.
        """

        remaining_attempts = remaining_attempts or self._options.max_repair_attempts

        # Define event handlers
        is_streaming = False
        streamer: Optional[StreamingResponse] = None

        def before_completion(
            ctx: TurnContext,
            memory: MemoryBase,
            functions: PromptFunctions,
            tokenizer: Tokenizer,
            template: PromptTemplate,
            streaming: bool,
        ) -> None:
            # Ignore events for other contexts
            if context != ctx:
                return

            # Check for a streaming response
            if streaming:
                is_streaming = True

            # Create streamer and send initial message
            streamer = StreamingResponse(context)
            memory.set("temp.streamer", streamer)
            if self.options.start_streaming_message:
                streamer.queue_informative_update(self.options.start_streaming_message)

        def chunk_received(
            ctx: TurnContext,
            memory: MemoryBase,
            chunk: PromptChunk,
        ) -> None:
            if (context != ctx) or streamer is None:
                return

            # Send chunk to client
            text = chunk.delta.content if (chunk.delta and chunk.delta.content) else ""
            if len(text) > 0:
                streamer.queue_text_chunk(text)

        # Subscribe to model events
        if self._options.model.events is not None:
            self._options.model.events.subscribe(StreamingEventTypes.BEFORE_COMPLETION, before_completion)
            self._options.model.events.subscribe(StreamingEventTypes.CHUNK_RECEIVED, chunk_received)
            
            if self._options.end_stream_handler is not None:
                handler: ResponseReceivedHandler = self._options.end_stream_handler
                self._options.model.events.subscribe(StreamingEventTypes.RESPONSE_RECEIVED, handler)

        try:
            if remaining_attempts <= 0:
                return PromptResponse(
                    status="invalid_response", error="Reached max model response repair attempts."
                )

            res = await self._options.model.complete_prompt(
                context=context,
                memory=memory,
                functions=functions,
                tokenizer=tokenizer,
                template=template,
            )

            if res.status != "success" or not res.message:
                return res

            if not res.input:
                res.input = Message(role="user", content=memory.get(self._options.input_variable))

            validation = await self._options.validator.validate_response(
                context=context,
                memory=memory,
                tokenizer=tokenizer,
                response=res,
                remaining_attempts=remaining_attempts,
            )

            if validation.value:
                res.message.content = validation.value

            if not validation.valid:
                fork = Memory(memory)

                if self._options.logger:
                    self._options.logger.info(f"REPAIRING RESPONSE:\n{res.message.content or ''}")

                self._add_message_to_history(
                    fork, f"{self._options.history_variable}-repair", res.message
                )

                self._add_message_to_history(
                    fork,
                    f"{self._options.history_variable}-repair",
                    Message(
                        role="user",
                        content=validation.feedback
                        or "The response was invalid. Try another strategy.",
                    ),
                )

                return await self.complete_prompt(
                    context=context,
                    memory=fork,
                    functions=functions,
                    tokenizer=tokenizer,
                    template=PromptTemplate(
                        name=template.name,
                        actions=template.actions,
                        augmentation=template.augmentation,
                        config=template.config,
                        prompt=Prompt(
                            sections=[
                                template.prompt,
                                ConversationHistorySection(
                                    variable=f"{self._options.history_variable}-repair"
                                ),
                            ]
                        ),
                    ),
                    remaining_attempts=remaining_attempts - 1,
                )

            self._add_message_to_history(memory, self._options.history_variable, res.input)
            self._add_message_to_history(memory, self._options.history_variable, res.message)

            if is_streaming and res.status == "success":
                # Delete message from response to avoid sending it twice
                res.message = None

            # End the stream if streaming
            if streamer is not None:
                await streamer.end_stream()
            return res
        except Exception as err:  # pylint: disable=broad-except
            return PromptResponse(status="error", error=str(err))
        finally:
            # Unsubscribe from model events
            if self._options.model.events is not None:
                self._options.model.events.unsubscribe(StreamingEventTypes.BEFORE_COMPLETION, before_completion)
                self._options.model.events.unsubscribe(StreamingEventTypes.CHUNK_RECEIVED, chunk_received)

                if self._options.end_stream_handler is not None:
                    handler: ResponseReceivedHandler = self._options.end_stream_handler
                    self._options.model.events.unsubscribe(StreamingEventTypes.RESPONSE_RECEIVED, handler)

    def _add_message_to_history(
        self, memory: MemoryBase, variable: str, messages: Union[Message[Any], List[Message[Any]]]
    ) -> None:

        history: List[Message] = memory.get(variable) or []
        if isinstance(messages, list):
            history.extend(messages)
        else:
            history.append(messages)

        if len(history) > self._options.max_history_messages:
            del history[0 : len(history) - self._options.max_history_messages]

        # Remove completed partial action outputs
        while history and history[0].role == "tool":
            del history[0]

        memory.set(variable, history)
