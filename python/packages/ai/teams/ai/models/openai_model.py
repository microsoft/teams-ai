"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from __future__ import annotations

import asyncio
import json
from dataclasses import dataclass
from logging import Logger
from typing import Callable, List, Optional, Union, cast

import openai
from botbuilder.core import TurnContext
from openai import NOT_GIVEN, AsyncStream
from openai.types import chat, shared_params
from openai.types.chat.chat_completion_message_tool_call_param import Function

from teams.streaming.prompt_chunk import PromptChunk

from ...state import MemoryBase
from ..prompts.message import ActionCall, ActionFunction, Message, MessageContext
from ..prompts.prompt_functions import PromptFunctions
from ..prompts.prompt_template import PromptTemplate
from ..tokenizers import Tokenizer
from .prompt_completion_model import PromptCompletionModel
from .prompt_completion_model_emitter import PromptCompletionModelEmitter
from .prompt_response import PromptResponse


@dataclass
class OpenAIModelOptions:
    """
    Options for configuring an `OpenAIModel` to call an OpenAI hosted model.
    """

    api_key: str
    "API key to use when calling the OpenAI API."

    default_model: str
    "Default model to use for completions."

    endpoint: Optional[str] = None
    "Optional. Endpoint to use when calling the OpenAI API."

    organization: Optional[str] = None
    "Optional. Organization to use when calling the OpenAI API."

    logger: Optional[Logger] = None
    "Optional. When set the model will log requests"

    stream: bool = False
    "Optional. Whether the model's responses should be streamed back."


@dataclass
class AzureOpenAIModelOptions:
    """
    Options for configuring an `OpenAIModel` to call an Azure OpenAI hosted model.
    """

    default_model: str
    "Default name of the Azure OpenAI deployment (model) to use."

    endpoint: str
    "Deployment endpoint to use."

    api_version: str = "2023-05-15"
    "Optional. Version of the API being called. Defaults to `2023-05-15`."

    api_key: Optional[str] = None
    "API key to use when making requests to Azure OpenAI."

    azure_ad_token_provider: Optional[Callable[..., str]] = None
    """Optional. A function that returns an access token for Microsoft Entra 
    (formerly known as Azure Active Directory), which will be invoked in every request.
    """

    organization: Optional[str] = None
    "Optional. Organization to use when calling the OpenAI API."

    logger: Optional[Logger] = None
    "Optional. When set the model will log requests"

    stream: bool = False
    "Optional. Whether the model's responses should be streamed back."


class OpenAIModel(PromptCompletionModel):
    """
    A `PromptCompletionModel` for calling OpenAI and Azure OpenAI hosted models.

    The model has been updated to support OpenAI's new o1/o3 family of models. That currently
    comes with a few constraints. These constraints are mostly handled for you but are worth noting:

    - The models introduce a new `max_completion_tokens` parameter and they've deprecated
    the `max_tokens` parameter. The model will automatically convert the incoming `max_tokens
    ` parameter to `max_completion_tokens` for you. But you should be aware that it has hidden
    token usage and costs that aren't constrained by the `max_completion_tokens` parameter.
    This means that you may see an increase in token usage and costs when using the models.

    - The models do not currently support the sending of system message so the model will
    map them to user message in this case.

    - The models do not currently support setting the `temperature`, `top_p`, and
    `presence_penalty` parameters so they will be ignored.

    - The models do not currently support the use of tools so you will need to use the
    "monologue" augmentation to call actions.
    """

    _options: Union[OpenAIModelOptions, AzureOpenAIModelOptions]
    _client: openai.AsyncOpenAI

    @property
    def options(self) -> Union[OpenAIModelOptions, AzureOpenAIModelOptions]:
        return self._options

    def __init__(self, options: Union[OpenAIModelOptions, AzureOpenAIModelOptions]) -> None:
        """
        Creates a new `OpenAIModel` instance.

        Args:
            options (OpenAIModelOptions | AzureOpenAIModelOptions): model options.
        """

        self._options = options

        if isinstance(options, OpenAIModelOptions):
            self._client = openai.AsyncOpenAI(
                api_key=options.api_key,
                base_url=options.endpoint,
                organization=options.organization,
                default_headers={"User-Agent": self.user_agent},
            )
        elif isinstance(options, AzureOpenAIModelOptions):
            self._client = openai.AsyncAzureOpenAI(
                api_key=options.api_key,
                api_version=options.api_version,
                azure_ad_token_provider=options.azure_ad_token_provider,
                azure_endpoint=options.endpoint,
                azure_deployment=options.default_model,
                organization=options.organization,
                default_headers={"User-Agent": self.user_agent},
            )
        self.events = PromptCompletionModelEmitter()

    async def complete_prompt(
        self,
        context: TurnContext,
        memory: MemoryBase,
        functions: PromptFunctions,
        tokenizer: Tokenizer,
        template: PromptTemplate,
    ) -> PromptResponse[str]:
        # pylint: disable-msg=too-many-locals
        max_input_tokens = template.config.completion.max_input_tokens

        # Setup tools if enabled
        is_tools_aug = (
            template.config.augmentation
            and template.config.augmentation.augmentation_type == "tools"
        )
        tool_choice = (
            template.config.completion.tool_choice
            if template.config.completion.tool_choice is not None
            else "auto"
        )
        parallel_tool_calls = (
            template.config.completion.parallel_tool_calls
            if template.config.completion.parallel_tool_calls is not None
            else True
        )
        tools: List[chat.ChatCompletionToolParam] = []

        # If tools is enabled, reformat actions to schema
        if is_tools_aug and template.actions:
            for action in template.actions:
                curr_tool = chat.ChatCompletionToolParam(
                    type="function",
                    function=shared_params.FunctionDefinition(
                        name=action.name,
                        description=action.description or "",
                        parameters=action.parameters or {},
                    ),
                )
                tools.append(curr_tool)

        model = (
            template.config.completion.model
            if template.config.completion.model is not None
            else self._options.default_model
        )
        is_thinking_model = model.startswith("o1") or model.startswith("o3")

        if self._options.stream and self.events is not None:
            # Signal start of completion
            self.events.emit_before_completion(
                context=context,
                memory=memory,
                functions=functions,
                tokenizer=tokenizer,
                template=template,
                streaming=True,
            )

        res = await template.prompt.render_as_messages(
            context=context,
            memory=memory,
            functions=functions,
            tokenizer=tokenizer,
            max_tokens=max_input_tokens,
        )

        if res.too_long:
            return PromptResponse[str](
                status="too_long",
                error=f"""
                the generated chat completion prompt had a length of {res.length} tokens
                which exceeded the max_input_tokens of {max_input_tokens}
                """,
            )

        if self._options.logger is not None:
            self._options.logger.debug(f"PROMPT:\n{res.output}")

        messages: List[chat.ChatCompletionMessageParam]
        messages = self._map_messages(res.output, is_thinking_model)

        try:
            extra_body = {}
            if template.config.completion.data_sources is not None:
                extra_body["data_sources"] = template.config.completion.data_sources

            max_tokens = template.config.completion.max_tokens
            completion = await self._client.chat.completions.create(
                messages=messages,
                model=model,
                presence_penalty=(
                    template.config.completion.presence_penalty if not is_thinking_model else 0
                ),
                frequency_penalty=template.config.completion.frequency_penalty,
                top_p=template.config.completion.top_p if not is_thinking_model else 1,
                temperature=template.config.completion.temperature if not is_thinking_model else 1,
                max_tokens=max_tokens if not is_thinking_model else NOT_GIVEN,
                max_completion_tokens=max_tokens if is_thinking_model else NOT_GIVEN,
                tools=tools if len(tools) > 0 else NOT_GIVEN,
                tool_choice=tool_choice if len(tools) > 0 else NOT_GIVEN,
                parallel_tool_calls=parallel_tool_calls if len(tools) > 0 else NOT_GIVEN,
                extra_body=extra_body,
                stream=self._options.stream,
            )

            if self._options.stream:
                # Log start of streaming
                if self._options.logger is not None:
                    self._options.logger.debug("STREAM STARTED:")

                # Enumerate the stream chunks
                message_content = ""
                message: Message[str] = Message(role="assistant", content="")
                completion = cast(AsyncStream[chat.ChatCompletionChunk], completion)

                async for chunk in completion:
                    delta = chunk.choices[0].delta

                    if delta.role:
                        message.role = delta.role

                    if delta.content:
                        message_content += delta.content

                    if is_tools_aug and delta.tool_calls:
                        if not hasattr(message, "action_calls") or message.action_calls is None:
                            message.action_calls = []

                        for tool_call in delta.tool_calls:
                            # Add empty tool call to message if new index
                            # Note that a single tool call can span multiple chunks
                            index = tool_call.index

                            if index >= len(message.action_calls):
                                message.action_calls.append(
                                    ActionCall(
                                        id="",
                                        type="function",
                                        function=ActionFunction(
                                            name="",
                                            arguments="",
                                        ),
                                    )
                                )

                            if tool_call.id:
                                message.action_calls[index].id = tool_call.id

                            if tool_call.type:
                                message.action_calls[index].type = tool_call.type

                            if tool_call.function:
                                if tool_call.function.name:
                                    message.action_calls[
                                        index
                                    ].function.name += tool_call.function.name

                                if tool_call.function.arguments:
                                    message.action_calls[
                                        index
                                    ].function.arguments += tool_call.function.arguments

                    if self._options.logger is not None:
                        self._options.logger.debug(f"CHUNK ${delta}")

                    curr_delta_message = PromptChunk(
                        delta=Message[str](
                            role=str(delta.role),
                            content=delta.content,
                            context=(
                                MessageContext.from_dict(delta.context)
                                if hasattr(delta, "context")
                                else None
                            ),
                        )
                    )

                    if self.events is not None:
                        self.events.emit_chunk_received(context, memory, curr_delta_message)

                message.content = message_content

                # Log stream completion
                if self._options.logger is not None:
                    self._options.logger.debug("STREAM COMPLETED:")

                res_input: Optional[Union[Message, List[Message]]] = None
                last_message = len(res.output) - 1

                # Skips the first message which is the prompt
                if last_message > 0 and res.output[last_message].role != "assistant":
                    res_input = res.output[last_message]

                response = PromptResponse[str](input=res_input, message=message)

                streamer = memory.get("temp.streamer")
                if (self.events is not None) and (streamer is not None):
                    self.events.emit_response_received(context, memory, response, streamer)

                # Let any pending events flush before returning
                await asyncio.sleep(0)
                return response

            completion = cast(chat.ChatCompletion, completion)
            if self._options.logger is not None:
                self._options.logger.debug("COMPLETION:\n%s", completion.model_dump_json())

            # Handle tools flow
            action_calls = []
            tool_calls = completion.choices[0].message.tool_calls

            if is_tools_aug and tool_calls:
                for curr_tool_call in tool_calls:
                    action_calls.append(
                        ActionCall(
                            id=curr_tool_call.id,
                            type=curr_tool_call.type,
                            function=ActionFunction(
                                name=curr_tool_call.function.name,
                                arguments=curr_tool_call.function.arguments,
                            ),
                        )
                    )

            input: Optional[Union[Message, List[Message]]] = None
            last_message = len(res.output) - 1

            # Skips the first message which is the prompt
            if last_message > 0 and res.output[last_message].role != "assistant":
                input = res.output[last_message]

                # Add remaining parallel tool calls
                if input.role == "tool":
                    first_message = len(res.output)
                    for msg in reversed(res.output):
                        if msg.action_calls:
                            break
                        first_message -= 1
                    input = res.output[first_message:]

            return PromptResponse[str](
                input=input,
                message=Message(
                    role=completion.choices[0].message.role,
                    content=completion.choices[0].message.content,
                    action_calls=(action_calls if is_tools_aug and len(action_calls) > 0 else None),
                    context=(
                        MessageContext.from_dict(completion.choices[0].message.context)
                        if hasattr(completion.choices[0].message, "context")
                        else None
                    ),
                ),
            )
        except openai.APIError as err:
            if self._options.logger is not None:
                self._options.logger.error("ERROR:\n%s", json.dumps(err.body))

            return PromptResponse[str](
                status="error",
                error=f"""
                The chat completion API returned an error
                status of {err.code}: {err.message}
                """,
            )

    def _map_messages(self, msgs: List[Message], is_thinking_model: bool):
        output = []
        for msg in msgs:
            param: Union[
                chat.ChatCompletionUserMessageParam,
                chat.ChatCompletionAssistantMessageParam,
                chat.ChatCompletionSystemMessageParam,
                chat.ChatCompletionToolMessageParam,
            ] = chat.ChatCompletionUserMessageParam(
                role="user",
                content=msg.content if msg.content is not None else "",
            )

            if msg.name:
                setattr(param, "name", msg.name)

            if msg.role == "assistant":
                param = chat.ChatCompletionAssistantMessageParam(
                    role="assistant",
                    content=msg.content if msg.content is not None else "",
                )

                tool_call_params: List[chat.ChatCompletionMessageToolCallParam] = []

                if msg.action_calls and len(msg.action_calls) > 0:
                    for tool_call in msg.action_calls:
                        tool_call_params.append(
                            chat.ChatCompletionMessageToolCallParam(
                                id=tool_call.id,
                                function=Function(
                                    name=tool_call.function.name,
                                    arguments=tool_call.function.arguments,
                                ),
                                type=tool_call.type,
                            )
                        )
                    param["content"] = None
                    param["tool_calls"] = tool_call_params

                if msg.name:
                    param["name"] = msg.name

            elif msg.role == "tool":
                param = chat.ChatCompletionToolMessageParam(
                    role="tool",
                    tool_call_id=msg.action_call_id if msg.action_call_id else "",
                    content=msg.content if msg.content else "",
                )
            elif msg.role == "system":
                # o1 and o3 models do not support system messages
                if is_thinking_model:
                    param = chat.ChatCompletionUserMessageParam(
                        role="user",
                        content=msg.content if msg.content is not None else "",
                    )
                else:
                    param = chat.ChatCompletionSystemMessageParam(
                        role="system",
                        content=msg.content if msg.content is not None else "",
                    )

                if msg.name:
                    param["name"] = msg.name

            output.append(param)
        return output
