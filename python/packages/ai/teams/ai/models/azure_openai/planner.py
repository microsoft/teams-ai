"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from semantic_kernel.connectors.ai.open_ai import (
    AzureChatCompletion,
    AzureTextCompletion,
)

from teams.ai.models.openai import OpenAIPlanner

from .planner_options import AzureOpenAIPlannerOptions


class AzureOpenAIPlanner(OpenAIPlanner):
    _options: AzureOpenAIPlannerOptions

    def __init__(self, options: AzureOpenAIPlannerOptions):
        super().__init__(options)

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
