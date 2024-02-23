"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Optional


@dataclass
class Validation:
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

    value: Optional[Any] = None
    """
    Optional. Replacement value to use for the response.
    Default: None
    """
