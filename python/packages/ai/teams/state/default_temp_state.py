"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from dataclasses import dataclass
from ..input_file import InputFile
from typing import List, Dict, Optional

@dataclass
class DefaultTempState:
    input: str
    input_files: List[InputFile]
    last_output: str
    action_outputs: Dict[str, str]
    auth_tokens: Dict[str, str]
    duplicate_token_exchange: Optional[bool]