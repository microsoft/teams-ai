"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from datetime import datetime
from logging import Logger
from typing import Any, Awaitable, Callable, List, Optional, Tuple, Union

import semantic_kernel as sk
from botbuilder.core import TurnContext
from semantic_kernel.connectors.ai import (
    ChatCompletionClientBase,
    ChatRequestSettings,
    CompleteRequestSettings,
    TextCompletionClientBase,
)
from semantic_kernel.connectors.ai.open_ai import (
    OpenAIChatCompletion,
    OpenAITextCompletion,
)

from teams.ai.actions import ActionTypes
from teams.ai.ai_history_options import AIHistoryOptions
from teams.ai.planner import (
    CommandType,
    Plan,
    Planner,
    PredictedDoCommand,
    PredictedSayCommand,
)
from teams.ai.planner.response_parser import parse_response
from teams.ai.prompts import PromptManager
from teams.ai.prompts.prompt_template import PromptTemplate
from teams.ai.prompts.utils import generate_sk_prompt_template_config
from teams.ai.state import TurnState

from .client import OpenAIClient, OpenAIClientError
from .planner_options import OpenAIPlannerOptions

# Define role names used by OpenAI API
SYSTEM_ROLE_NAME: str = "system"
USER_ROLE_NAME: str = "user"
ASSISTANT_ROLE_NAME: str = "assistant"


class OpenAIPlanner(Planner):
    """
    Planner that uses OpenAI's API to generate prompts
    """

    log: Optional[Logger]

    _options: OpenAIPlannerOptions
    _sk: sk.Kernel
    _prompt_manager: PromptManager
    _client: OpenAIClient

    def __init__(self, options: OpenAIPlannerOptions) -> None:
        self.log = None
        self._options = options
        self._prompt_manager = PromptManager(options.prompt_folder)
        self._client = OpenAIClient(self._options.api_key, organization=self._options.organization)
        self._sk = sk.Kernel()
        self._add_text_completion_service()
        self._add_chat_completion_service()

    def add_function(
        self,
        name: str,
        handler: Callable[[TurnContext, TurnState], Awaitable[Any]],
        *,
        allow_overrides=False,
    ) -> None:
        self._prompt_manager.add_function(name, handler, allow_overrides=allow_overrides)

    async def generate_plan(
        self,
        turn_context: TurnContext,
        state: TurnState,
        prompt_name_or_template: Union[str, PromptTemplate],
        *,
        history_options: AIHistoryOptions = AIHistoryOptions(),
    ) -> Plan:
        """
        Generates a plan based on the given turn state and prompt name or template.
        Args:
            turn_context (TurnContext): The turn context for current turn of conversation
            state (TurnState): The current turn state.
            prompt_name_or_template (Union[str, PromptTemplate]):
                The name of the prompt or a prompt template to use.
            history_options (AIHistoryOptions): The options for the AI history.
        Returns:
            Plan: The generated plan.
        """
        prompt_template = await self._prompt_manager.render_prompt(
            turn_context, state, prompt_name_or_template
        )
        plan = await self.review_prompt(turn_context, state, prompt_template)

        if plan:
            return plan

        result = await self._complete_prompt(state, prompt_template, history_options)

        if len(result) > 0:
            # Patch the occasional "Then DO" which gets predicted
            result = result.strip().replace("Then DO ", "THEN DO ").replace("Then SAY ", "THEN SAY")
            if result.startswith("THEN "):
                result = result[5:]

            assistant_prefix = (
                history_options.assistant_prefix if history_options is not None else None
            )

            if assistant_prefix:
                # The model sometimes predicts additional text
                # for the human side of things so skip that.
                position = result.lower().find(assistant_prefix.lower())
                if position >= 0:
                    result = result[position + len(assistant_prefix) :]

            plan = parse_response(result)

            # Filter to only a single SAY command
            if self._options.one_say_per_turn:
                spoken: bool = False
                new_commands = []
                for command in plan.commands:
                    if command.type == CommandType.SAY:
                        if spoken:
                            continue

                        new_commands.append(command)
                        spoken = True
                    else:
                        new_commands.append(command)
                plan.commands = new_commands

            return await self.review_plan(
                turn_context,
                state,
                plan,
            )

        return Plan()

    async def review_prompt(
        self,
        _context: TurnContext,
        state: TurnState,
        _prompt: PromptTemplate,
    ) -> Optional[Plan]:
        if self._options.moderate == "output":
            return None

        try:
            res = await self._client.create_moderation(
                state.temp.input,
            )

            if res.data.results[0].flagged:
                return Plan(
                    commands=[
                        PredictedDoCommand(
                            action=ActionTypes.FLAGGED_INPUT,
                            entities=vars(res.data.results[0]),
                        )
                    ]
                )
        except OpenAIClientError as e:
            return Plan(
                commands=[
                    PredictedDoCommand(
                        action=ActionTypes.HTTP_ERROR,
                        entities={"status": e.status, "message": e.message},
                    )
                ]
            )
        return None

    async def review_plan(
        self,
        _context: TurnContext,
        _state: TurnState,
        plan: Plan,
    ) -> Plan:
        if self._options.moderate == "input":
            return plan

        for cmd in plan.commands:
            if isinstance(cmd, PredictedSayCommand):
                try:
                    res = await self._client.create_moderation(
                        cmd.response,
                    )

                    if res.data.results[0].flagged:
                        return Plan(
                            commands=[
                                PredictedDoCommand(
                                    action=ActionTypes.FLAGGED_INPUT,
                                    entities=vars(res.data.results[0]),
                                )
                            ]
                        )
                except OpenAIClientError as e:
                    return Plan(
                        commands=[
                            PredictedDoCommand(
                                action=ActionTypes.HTTP_ERROR,
                                entities={"status": e.status, "message": e.message},
                            )
                        ]
                    )

        return plan

    def _add_text_completion_service(self) -> None:
        # TODO: default_model may not be text completion
        self._sk.add_text_completion_service(
            "openai_text_completion",
            OpenAITextCompletion(
                self._options.default_model, self._options.api_key, self._options.organization
            ),
        )

    def _add_chat_completion_service(self) -> None:
        # TODO: default_model may not be chat completion
        self._sk.add_chat_service(
            "openai_chat_completion",
            OpenAIChatCompletion(
                self._options.default_model, self._options.api_key, self._options.organization
            ),
        )

    async def _complete_prompt(
        self,
        turn_state: TurnState,
        prompt_template: PromptTemplate,
        history_options: AIHistoryOptions,
    ) -> str:
        model: str = self._get_model(prompt_template)
        is_chat_completion: bool = model.lower().startswith("gpt-")
        start_time = datetime.now()
        log_prefix = "CHAT" if is_chat_completion else "PROMPT"

        self._log_request(f"\n{log_prefix} REQUEST: \n'''\n{prompt_template.text}\n'''")

        if is_chat_completion:
            user_message = turn_state.temp.input
            result = await self._complete_chat(
                prompt_template, turn_state, user_message, history_options
            )
        else:
            result = await self._complete_text(prompt_template)

        duration = datetime.now() - start_time
        # TODO: investigate how to get prompt/completion tokens
        self._log_request(f"\n{log_prefix} SUCCEEDED: duration={duration} response={result}")

        return result

    async def _complete_chat(
        self,
        prompt_template: PromptTemplate,
        state: TurnState,
        user_message: str,
        options: AIHistoryOptions,
    ):
        prompt_template_config = generate_sk_prompt_template_config(prompt_template)
        request_settings = ChatRequestSettings.from_completion_config(
            prompt_template_config.completion
        )

        chat_completion_client = self._sk.get_ai_service(ChatCompletionClientBase)(self._sk)

        chat_history: List[Tuple[str, str]] = []
        if self._options.use_system_message:
            chat_history.append((SYSTEM_ROLE_NAME, prompt_template.text))
        else:
            chat_history.append((USER_ROLE_NAME, prompt_template.text))

        # Populate conversation history
        if options.track_history:
            history: List[Tuple[str, str]] = state.conversation.history.to_tuples(
                options.max_tokens,
                "cl100k_base",  # This function is only called for gpt-4 and gpt-3.5-turbo model
            )
            chat_history.extend(history)

        if user_message:
            chat_history.append((USER_ROLE_NAME, user_message))

        result = await chat_completion_client.complete_chat_async(chat_history, request_settings)
        if isinstance(result, str):
            return result

        return "\n".join(result)

    async def _complete_text(self, prompt_template: PromptTemplate):
        prompt_template_config = generate_sk_prompt_template_config(prompt_template)
        request_settings = CompleteRequestSettings.from_completion_config(
            prompt_template_config.completion
        )

        text_completion_client = self._sk.get_ai_service(TextCompletionClientBase)(self._sk)
        result = await text_completion_client.complete_async(prompt_template.text, request_settings)
        if isinstance(result, str):
            return result

        return "\n".join(result)

    def _get_model(self, prompt_template: PromptTemplate) -> str:
        default_backends = prompt_template.config.default_backends
        if default_backends and len(default_backends) > 0:
            return default_backends[0]

        return self._options.default_model

    def _log_request(self, request: str) -> None:
        if self.log:
            self.log.debug(request)