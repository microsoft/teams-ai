"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Optional


@dataclass
class FunctionCall:
    """A named function to call."""

    name: Optional[str]
    """Name of the function to call."""

    arguments: Optional[str]
    """Arguments to pass to the function. Must be deserialized."""
