"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from typing import Literal, Optional

from teams.ai.models.openai import OpenAIPlannerOptions


class AzureOpenAIPlannerOptions(OpenAIPlannerOptions):
    endpoint: str

    def __init__(
        self,
        api_key: str,
        default_model: str,
        endpoint: str,
        *,
        prompt_folder: str = "prompts",
        moderate: Literal["input", "output", "both"] = "both",
        organization: Optional[str] = None,
        one_say_per_turn: bool = False,
        use_system_message: bool = False,
    ):
        super().__init__(
            api_key,
            default_model,
            prompt_folder=prompt_folder,
            moderate=moderate,
            organization=organization,
            endpoint=endpoint,
            one_say_per_turn=one_say_per_turn,
            use_system_message=use_system_message,
        )
