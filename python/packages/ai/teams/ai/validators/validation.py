"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from dataclasses import dataclass
from typing import Generic, Optional, TypeVar

ValueT = TypeVar("ValueT")


@dataclass
class Validation(Generic[ValueT]):
    """
    Response returned by a `PromptResponseValidator`.
    """

    valid: bool = True
    """
    Whether the validation is valid.
    Default: True
    """

    feedback: Optional[str] = None
    """
    Optional. Repair instructions to send to the model.
    Default: None
    """

    value: Optional[ValueT] = None
    """
    Optional. Replacement value to use for the response.
    Default: None
    """
