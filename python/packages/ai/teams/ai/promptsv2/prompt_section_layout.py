"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from dataclasses import dataclass
from typing import Generic, Optional, TypeVar

from .prompt_section import PromptSection
from .rendered_prompt_section import RenderedPromptSection

T = TypeVar("T")


@dataclass
class PromptSectionLayout(Generic[T]):
    section: PromptSection
    layout: Optional[RenderedPromptSection[T]] = None
