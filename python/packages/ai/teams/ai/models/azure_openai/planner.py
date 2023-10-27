"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from typing import Optional

from botbuilder.core import TurnContext
from semantic_kernel.connectors.ai.open_ai import (
    AzureChatCompletion,
    AzureTextCompletion,
)

from teams.ai.models.openai import OpenAIPlanner
from teams.ai.planner import Plan
from teams.ai.prompts import PromptTemplate
from teams.ai.state import TurnState

from .client import AzureOpenAIClient
from .planner_options import AzureOpenAIPlannerOptions


class AzureOpenAIPlanner(OpenAIPlanner):
    _options: AzureOpenAIPlannerOptions
    _client: AzureOpenAIClient

    def __init__(self, options: AzureOpenAIPlannerOptions):
        super().__init__(options)
        self._options = options
        self._client = AzureOpenAIClient(self._options.api_key, base_url=options.endpoint)

    async def review_prompt(
        self,
        _context: TurnContext,
        _state: TurnState,
        _prompt: PromptTemplate,
    ) -> Optional[Plan]:
        return None

    async def review_plan(
        self,
        _context: TurnContext,
        _state: TurnState,
        plan: Plan,
    ) -> Plan:
        return plan

    def _add_text_completion_service(self) -> None:
        self._sk.add_text_completion_service(
            "azure_openai_text_completion",
            AzureTextCompletion(
                self._options.default_model, self._options.endpoint, self._options.api_key
            ),
        )

    def _add_chat_completion_service(self) -> None:
        self._sk.add_chat_service(
            "azure_openai_chat_completion",
            AzureChatCompletion(
                self._options.default_model, self._options.endpoint, self._options.api_key
            ),
        )
