"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from dataclasses import dataclass
from typing import Literal

MessageRole = Literal["system", "user", "assistant", "say", "do"]


@dataclass
class Message:
    role: MessageRole
    content: str
