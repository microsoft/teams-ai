"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Generic, List, Literal, Optional, TypeVar, Union

from ..prompts.message import Message

ContentT = TypeVar("ContentT")
PromptResponseStatus = Literal["success", "error", "rate_limited", "invalid_response", "too_long"]


@dataclass
class PromptResponse(Generic[ContentT]):
    """
    Response returned by a `PromptCompletionClient`.
    """

    status: PromptResponseStatus = "success"
    """
    Status of the prompt response.
    """

    input: Optional[Union[Message[Any], List[Message[Any]]]] = None
    """
    Input message sent to the model. `undefined` if no input was sent.
    """

    message: Optional[Message[ContentT]] = None
    """
    Message returned.
    """

    error: Optional[str] = None
    """
    Error returned.
    """
