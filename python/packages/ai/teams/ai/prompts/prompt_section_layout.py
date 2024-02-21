"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Generic, Optional, TypeVar

from .rendered_prompt_section import RenderedPromptSection
from .sections.prompt_section import PromptSection

T = TypeVar("T")


@dataclass
class _PromptSectionLayout(Generic[T]):
    section: PromptSection
    layout: Optional[RenderedPromptSection[T]] = None
