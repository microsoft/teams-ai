"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from dataclasses import dataclass
from typing import Optional


@dataclass
class OpenAIPlannerOptions:
    api_key: str
    default_model: str
    prompt_folder: str = "prompts"
    organization: Optional[str] = None
    endpoint: Optional[str] = None
    one_say_per_turn: bool = False
    use_system_message: bool = False
    log_requests: bool = False
