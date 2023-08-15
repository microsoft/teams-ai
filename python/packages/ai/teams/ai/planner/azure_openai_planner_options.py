"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from typing import Optional

from .openai_planner_options import OpenAIPlannerOptions


class AzureOpenAIPlannerOptions(OpenAIPlannerOptions):
    endpoint: str

    def __init__(
        self,
        api_key: str,
        default_model: str,
        prompt_folder: str,
        endpoint: str,
        *,
        organization: Optional[str] = None,
        one_say_per_turn: bool = False,
        use_system_message: bool = False,
        log_requests: bool = False,
    ):
        self.endpoint = endpoint
        super().__init__(
            api_key,
            default_model,
            prompt_folder,
            organization=organization,
            one_say_per_turn=one_say_per_turn,
            use_system_message=use_system_message,
            log_requests=log_requests,
        )
