"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from dataclasses import dataclass
from typing import Generic, Literal, Optional, TypeVar, Union

from .function_call import FunctionCall

T = TypeVar("T")


@dataclass
class Message(Generic[T]):
    role: str
    content: Optional[T]
    function_call: Optional[FunctionCall] = None
    name: Optional[str] = None


@dataclass
class ImageUrl:
    url: str


@dataclass
class TextContentPart:
    type: Literal["text"]
    text: str


@dataclass
class ImageContentPart:
    type: Literal["image_url"]
    image_url: Union[str, ImageUrl]


MessageContentParts = Union[TextContentPart, ImageContentPart]
