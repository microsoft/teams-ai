"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""
from datetime import datetime
from typing import Any, Callable, Optional, Union

import semantic_kernel as sk
from botbuilder.core import TurnContext
from semantic_kernel.connectors.ai import CompleteRequestSettings
from semantic_kernel.connectors.ai.open_ai import (
    OpenAIChatCompletion,
    OpenAITextCompletion,
)
from semantic_kernel.connectors.ai.text_completion_client_base import (
    TextCompletionClientBase,
)
from semantic_kernel.utils.null_logger import NullLogger

from teams.ai.prompts import PromptManager
from teams.ai.prompts.prompt_template import PromptTemplate
from teams.ai.prompts.utils import generate_sk_prompt_template_config
from teams.ai.state import TurnState

from .ai_history_options import AIHistoryOptions
from .command_type import CommandType
from .openai_planner_options import OpenAIPlannerOptions
from .plan import Plan
from .planner import Planner
from .response_parser import parse_response


class OpenAIPlanner(Planner):
    """
    Planner that uses OpenAI's API to generate prompts
    """

    _options: OpenAIPlannerOptions
    _sk: sk.Kernel
    _prompt_manager: PromptManager

    def __init__(self, options: OpenAIPlannerOptions) -> None:
        self._options = options
        self._prompt_manager = PromptManager(options.prompt_folder)
        self._sk = sk.Kernel()
        self._add_text_completion_service()
        self._add_chat_completion_service()

    async def add_function(
        self, name: str, handler: Callable[[TurnContext, TurnState], Any], *, allow_overrides=False
    ) -> None:
        self._prompt_manager.add_function(name, handler, allow_overrides=allow_overrides)

    async def generate_plan(
        self,
        turn_context: TurnContext,
        state: TurnState,
        prompt_name_or_template: Union[str, PromptTemplate],
        *,
        history_options: Optional[AIHistoryOptions] = None,
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
        result = await self._complete_prompt(prompt_template)

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
                position = result.lower().index(assistant_prefix.lower())
                if position >= 0:
                    result = result[position + len(assistant_prefix) :]

            plan: Plan = parse_response(result)

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

            return plan

        return Plan()

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
        prompt_template: PromptTemplate,
    ) -> str:
        model: str = self._get_model(prompt_template)
        is_chat_completion: bool = model.lower().startswith("gpt-")
        start_time = datetime.now()
        log_prefix = "CHAT" if is_chat_completion else "PROMPT"

        self._log_request(f"\n{log_prefix} REQUEST: \n'''\n{prompt_template.text}\n'''")

        result: str

        # TODO: implement chat completion
        result = await self._complete_text(prompt_template)

        duration = datetime.now() - start_time
        # TODO: investigate how to get prompt/completion tokens
        self._log_request(f"\n{log_prefix} SUCCEEDED: duration={duration} response={result}")

        return result

    async def _complete_text(self, prompt_template: PromptTemplate):
        prompt_template_config = generate_sk_prompt_template_config(prompt_template)
        request_settings = CompleteRequestSettings.from_completion_config(
            prompt_template_config.completion
        )

        text_completion_client = self._sk.get_ai_service(TextCompletionClientBase)(self)
        result = await text_completion_client.complete_async(
            prompt_template.text, request_settings, NullLogger()
        )
        if isinstance(result, str):
            return result
        else:
            return "\n".join(result)

    def _get_model(self, prompt_template: PromptTemplate) -> str:
        default_backends = prompt_template.config.default_backends
        if default_backends and len(default_backends) > 0:
            return default_backends[0]

        return self._options.default_model

    def _log_request(self, request: str) -> None:
        if self._options.log_requests:
            print(request)
