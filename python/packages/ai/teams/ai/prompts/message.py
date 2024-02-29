"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Generic, Literal, Optional, TypeVar, Union

from .function_call import FunctionCall

T = TypeVar("T")


@dataclass
class Message(Generic[T]):
    """
    A message object sent to or received from an LLM.

    Attributes:
        role (str): The messages role. Typically 'system', 'user', 'assistant', 'function'.
        content (Optional[T]): Text of the message.
        function_call (Optional[FunctionCall]): A named function to call.
        name (Optional[str]): Name of the function that was called.
    """

    role: str
    content: Optional[T] = None
    function_call: Optional[FunctionCall] = None
    name: Optional[str] = None


@dataclass
class ImageUrl:
    """
    Url for an image

    Attributes:
        url (str): Url of the image
    """

    url: str


@dataclass
class TextContentPart:
    """
    Represents text content part of a message

    Attributes:
        text (str): Text content
    """

    type: Literal["text"]
    text: str


@dataclass
class ImageContentPart:
    """
    Represents image content part of a message

    Attributes:
        image_url (Union[str, ImageUrl]): Url for the image
    """

    type: Literal["image_url"]
    image_url: Union[str, ImageUrl]


MessageContentParts = Union[TextContentPart, ImageContentPart]
"""
Represents part of the message's content
"""
