"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from dataclasses import dataclass
from typing import Optional

import openai

from ...app_error import ApplicationError
from .openai_moderator import OpenAIModerator, OpenAIModeratorOptions


@dataclass
class AzureContentSafetyModeratorOptions(OpenAIModeratorOptions):
    """
    Options for the OpenAI based moderator.
    """

    api_version: Optional[str] = None
    "Optional. Azure Content Safety API version."


class AzureContentSafetyModerator(OpenAIModerator):
    """
    An Azure OpenAI moderator that uses OpenAI's moderation API
    to review prompts and plans for safety.
    """

    _options: AzureContentSafetyModeratorOptions

    @property
    def options(self) -> AzureContentSafetyModeratorOptions:
        return self._options

    def __init__(self, options: AzureContentSafetyModeratorOptions) -> None:
        """
        Creates a new instance of the Azure OpenAI based moderator.

        Args:
            options (AzureContentSafetyModeratorOptions): options for the moderator.
        """

        if options.endpoint is None:
            raise ApplicationError(
                "options.endpoint is required when using AzureContentSafetyModerator"
            )

        super().__init__(
            options,
            openai.AsyncAzureOpenAI(
                azure_endpoint=options.endpoint,
                azure_deployment=options.model,
                api_key=options.api_key,
                api_version=options.api_version,
                organization=options.organization,
                default_headers={"User-Agent": "teamsai-py/1.0.0"},
            ),
        )
