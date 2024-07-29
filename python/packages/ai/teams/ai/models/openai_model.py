"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from __future__ import annotations

import json
from dataclasses import dataclass
from logging import Logger
from typing import Callable, List, Optional, Union, cast

import openai
from botbuilder.core import TurnContext
from openai.types import chat, shared_params

from ...state import MemoryBase
from ..augmentations.tools_constants import ACTIONS_HISTORY
from ..prompts.message import ActionCall, ActionFunction, Message, MessageContext
from ..prompts.prompt_functions import PromptFunctions
from ..prompts.prompt_template import PromptTemplate
from ..tokenizers import Tokenizer
from .prompt_completion_model import PromptCompletionModel
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


class OpenAIModel(PromptCompletionModel):
    """
    A `PromptCompletionModel` for calling OpenAI and Azure OpenAI hosted models.
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

    async def complete_prompt(
        self,
        context: TurnContext,
        memory: MemoryBase,
        functions: PromptFunctions,
        tokenizer: Tokenizer,
        template: PromptTemplate,
    ) -> PromptResponse[str]:
        max_tokens = template.config.completion.max_input_tokens

        # Setup actions if enabled
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
        if is_tools_aug:
            if not template.actions or len(template.actions) == 0:
                return PromptResponse[str](
                    status="error", error="Missing tools in template.actions"
                )
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

        res = await template.prompt.render_as_messages(
            context=context,
            memory=memory,
            functions=functions,
            tokenizer=tokenizer,
            max_tokens=max_tokens,
        )

        if res.too_long:
            return PromptResponse[str](
                status="too_long",
                error=f"""
                the generated chat completion prompt had a length of {res.length} tokens
                which exceeded the max_input_tokens of {max_tokens}
                """,
            )

        if self._options.logger is not None:
            self._options.logger.debug(f"PROMPT:\n{res.output}")

        messages: List[chat.ChatCompletionMessageParam] = []

        # Submit tool outputs, if previously invoked
        if memory.has(ACTIONS_HISTORY):
            tools_messages = cast(
                List[chat.ChatCompletionMessageParam], memory.get(ACTIONS_HISTORY)
            )
            messages.extend(tools_messages)
            memory.set(ACTIONS_HISTORY, [])

        for msg in res.output:
            param: Union[
                chat.ChatCompletionUserMessageParam,
                chat.ChatCompletionAssistantMessageParam,
                chat.ChatCompletionSystemMessageParam,
            ] = chat.ChatCompletionUserMessageParam(
                role="user",
                content=msg.content if msg.content is not None else "",
            )

            if msg.name:
                param["name"] = msg.name

            if msg.role == "assistant":
                param = chat.ChatCompletionAssistantMessageParam(
                    role="assistant",
                    content=msg.content if msg.content is not None else "",
                )

                if msg.name:
                    param["name"] = msg.name
            elif msg.role == "system":
                param = chat.ChatCompletionSystemMessageParam(
                    role="system",
                    content=msg.content if msg.content is not None else "",
                )

                if msg.name:
                    param["name"] = msg.name

            messages.append(param)

        try:
            extra_body = {}
            if template.config.completion.data_sources is not None:
                extra_body["data_sources"] = template.config.completion.data_sources

            completion = await self._client.chat.completions.create(
                messages=messages,
                model=model,
                presence_penalty=template.config.completion.presence_penalty,
                frequency_penalty=template.config.completion.frequency_penalty,
                top_p=template.config.completion.top_p,
                temperature=template.config.completion.temperature,
                max_tokens=max_tokens,
                tools=tools,
                tool_choice=tool_choice,
                parallel_tool_calls=parallel_tool_calls,
                extra_body=extra_body,
            )

            if self._options.logger is not None:
                self._options.logger.debug("COMPLETION:\n%s", completion.model_dump_json())

            # Handle tools flow
            action_calls: List[ActionCall] = []
            response_message = completion.choices[0].message

            if is_tools_aug:
                tool_calls = response_message.tool_calls
                if tool_calls and len(tool_calls) > 0:
                    messages.append(
                        cast(chat.ChatCompletionAssistantMessageParam, response_message)
                    )

                    if not memory.has("conversation"):
                        memory.set("conversation", {})

                    memory.set(ACTIONS_HISTORY, messages)

                    for tool_call in tool_calls:
                        action_calls.append(
                            ActionCall(
                                id=tool_call.id,
                                type=tool_call.type,
                                function=ActionFunction(
                                    name=tool_call.function.name,
                                    arguments=tool_call.function.arguments,
                                ),
                            )
                        )

            input: Optional[Message] = None
            last_message = len(res.output) - 1

            # Skips the first message which is the prompt
            if last_message > 0 and res.output[last_message].role == "user":
                input = res.output[last_message]

            return PromptResponse[str](
                input=input,
                message=Message(
                    role=completion.choices[0].message.role,
                    content=completion.choices[0].message.content,
                    action_calls=(
                        action_calls
                        if is_tools_aug and action_calls and len(action_calls) > 0
                        else None
                    ),
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
