"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from typing import Literal, Optional


class OpenAIPlannerOptions:
    api_key: str
    default_model: str
    moderate: Literal["input", "output", "both"]
    prompt_folder: str
    organization: Optional[str]
    endpoint: Optional[str]
    one_say_per_turn: bool
    use_system_message: bool
    log_requests: bool

    def __init__(
        self,
        api_key: str,
        default_model: str,
        *,
        moderate: Literal["input", "output", "both"] = "both",
        prompt_folder: str = "prompts",
        organization: Optional[str] = None,
        endpoint: Optional[str] = None,
        one_say_per_turn: bool = False,
        use_system_message: bool = False,
        log_requests: bool = False,
    ):
        self.api_key = api_key
        self.default_model = default_model
        self.moderate = moderate
        self.prompt_folder = prompt_folder
        self.organization = organization
        self.endpoint = endpoint
        self.one_say_per_turn = one_say_per_turn
        self.use_system_message = use_system_message
        self.log_requests = log_requests
