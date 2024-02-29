"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Generic, TypeVar

T = TypeVar("T")


@dataclass
class RenderedPromptSection(Generic[T]):
    """
    The result of rendering a section.

    Attributes:
        output (T): The section that was rendered.
        length (int): The number of tokens that were rendered.
        too_long (bool): If true the section was truncated because it exceeded the maxTokens budget.
    """

    output: T
    length: int
    too_long: bool
