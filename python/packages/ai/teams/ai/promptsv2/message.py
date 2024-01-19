"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from dataclasses import dataclass
from typing import Generic, Optional, TypeVar

from .function_call import FunctionCall

T = TypeVar("T")


@dataclass
class Message(Generic[T]):
    role: str
    content: Optional[T]
    function_call: Optional[FunctionCall]
    name: Optional[str]
