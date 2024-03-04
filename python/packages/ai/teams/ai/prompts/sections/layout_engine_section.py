"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from __future__ import annotations

import asyncio
from typing import Any, Awaitable, Callable, List, Optional

from botbuilder.core import TurnContext

from ....state import MemoryBase
from ...tokenizers import Tokenizer
from ..message import Message
from ..prompt_functions import PromptFunctions
from ..prompt_section_layout import _PromptSectionLayout
from ..rendered_prompt_section import RenderedPromptSection
from .prompt_section import PromptSection


class LayoutEngineSection(PromptSection):
    """
    Base layout engine that renders a set of `auto`, `fixed`, or `proportional` length sections.
    This class is used internally by the `Prompt` and `GroupSection` classes to
    render their sections.
    """

    _sections: List[PromptSection]
    _required: bool
    _tokens: float
    _separator: str

    @property
    def sections(self) -> List[PromptSection]:
        return self._sections

    @property
    def required(self) -> bool:
        return self._required

    @property
    def tokens(self) -> float:
        return self._tokens

    @property
    def separator(self) -> str:
        return self._separator

    def __init__(
        self, sections: List[PromptSection], tokens: float, required: bool, separator: str
    ):
        """
        Args:
            sections (List[PromptSection]): List of sections to layout.
            tokens (float): Sizing strategy for this section.
            required (bool): Indicates if this section is required.
            separator (str): Separator to use between sections when rendering as text.
        """
        self._sections = sections
        self._required = required
        self._tokens = tokens
        self._separator = separator

    async def render_as_text(
        self,
        context: TurnContext,
        memory: MemoryBase,
        functions: PromptFunctions,
        tokenizer: Tokenizer,
        max_tokens: int,
    ) -> RenderedPromptSection[str]:
        """
        Renders the sections as text.

        Args:
            context (TurnContext): Context for the current turn of conversation with the user.
            memory (MemoryBase): The current memory.
            functions (PromptFunctions): The functions available to use in the prompt.
            tokenizer (Tokenizer): Tokenizer to use when rendering as text.
            max_tokens (int): Maximum number of tokens allowed.

        Returns:
            RenderedPromptSection[str]: The rendered sections as text.
        """

        # Start a new layout
        layout: List[_PromptSectionLayout[str]] = []
        # Adds all sections from the current LayoutEngine hierarchy to a flat array
        self._add_sections_to_layout(self.sections, layout)

        # Layout sections
        remaining = await self._layout_sections(
            layout,
            max_tokens,
            lambda section: section.render_as_text(
                context, memory, functions, tokenizer, max_tokens
            ),
            lambda section, remaining: section.render_as_text(
                context, memory, functions, tokenizer, remaining
            ),
            True,
            tokenizer,
        )

        # Build output
        output = [section.layout.output for section in layout if section.layout]
        text = self.separator.join(output)
        return RenderedPromptSection(
            output=text, length=len(tokenizer.encode(text)), too_long=remaining < 0
        )

    async def render_as_messages(
        self,
        context: TurnContext,
        memory: MemoryBase,
        functions: PromptFunctions,
        tokenizer: Tokenizer,
        max_tokens: int,
    ) -> RenderedPromptSection[List[Message]]:
        """
        Renders the sections as messages.

        Args:
            context (TurnContext): Context for the current turn of conversation with the user.
            memory (MemoryBase): The current memory.
            functions (PromptFunctions): The functions available to use in the prompt.
            tokenizer (Tokenizer): Tokenizer to use when rendering as text.
            max_tokens (int): Maximum number of tokens allowed.

        Returns:
            RenderedPromptSection[List[Message]]: The rendered sections as messages.
        """

        # Start a new layout
        layout: List[_PromptSectionLayout[List[Message]]] = []
        # Adds all sections from the current LayoutEngine hierarchy to a flat array
        self._add_sections_to_layout(self.sections, layout)

        # Layout sections
        remaining = await self._layout_sections(
            layout,
            max_tokens,
            lambda section: section.render_as_messages(
                context, memory, functions, tokenizer, max_tokens
            ),
            lambda section, remaining: section.render_as_messages(
                context, memory, functions, tokenizer, remaining
            ),
        )

        # Build output
        output = [
            message for section in layout if section.layout for message in section.layout.output
        ]
        return RenderedPromptSection(
            output=output, length=self._get_layout_length(layout), too_long=remaining < 0
        )

    def _add_sections_to_layout(
        self, sections: List[PromptSection], layout: List[_PromptSectionLayout[Any]]
    ):
        for section in sections:
            if isinstance(section, LayoutEngineSection):
                self._add_sections_to_layout(section.sections, layout)
            else:
                layout.append(_PromptSectionLayout(section=section))

    async def _layout_sections(
        self,
        layout: List[_PromptSectionLayout[Any]],
        max_tokens: int,
        callback_fixed: Callable[[PromptSection], Awaitable[RenderedPromptSection[Any]]],
        callback_proportional: Callable[
            [PromptSection, int], Awaitable[RenderedPromptSection[Any]]
        ],
        text_layout: bool = False,
        tokenizer: Optional[Tokenizer] = None,
    ) -> int:
        # Layout fixed sections
        await self._layout_fixed_sections(layout, callback_fixed)

        # Get tokens remaining and drop optional sections if too long
        remaining = max_tokens - self._get_layout_length(layout, text_layout, tokenizer)
        while remaining < 0 and self._drop_last_optional_section(layout):
            remaining = max_tokens - self._get_layout_length(layout, text_layout, tokenizer)

        # Layout proportional sections
        if self._needs_more_layout(layout) and remaining > 0:
            # Layout proportional sections
            await self._layout_proportional_sections(
                layout, lambda section: callback_proportional(section, remaining)
            )

            # Get tokens remaining and drop optional sections if too long
            remaining = max_tokens - self._get_layout_length(layout, text_layout, tokenizer)
            while remaining < 0 and self._drop_last_optional_section(layout):
                remaining = max_tokens - self._get_layout_length(layout, text_layout, tokenizer)

        return remaining

    async def _layout_fixed_sections(
        self,
        layouts: List[_PromptSectionLayout[Any]],
        callback: Callable[[PromptSection], Awaitable[RenderedPromptSection[Any]]],
    ) -> None:
        tasks: List[Awaitable] = []
        for layout in layouts:
            if layout.section.tokens < 0 or layout.section.tokens > 1.0:

                async def task(layout: _PromptSectionLayout[Any]) -> None:
                    output = await callback(layout.section)
                    layout.layout = output

                tasks.append(task(layout))

        await asyncio.gather(*tasks)

    async def _layout_proportional_sections(
        self,
        layouts: List[_PromptSectionLayout[Any]],
        callback: Callable[[PromptSection], Awaitable[RenderedPromptSection[Any]]],
    ) -> None:
        tasks: List[Awaitable] = []
        for layout in layouts:
            if 0.0 <= layout.section.tokens <= 1.0:

                async def task(layout: _PromptSectionLayout[Any]) -> None:
                    output = await callback(layout.section)
                    layout.layout = output

                tasks.append(task(layout))

        await asyncio.gather(*tasks)

    def _get_layout_length(
        self,
        layout: List[_PromptSectionLayout[Any]],
        text_layout: bool = False,
        tokenizer: Optional[Tokenizer] = None,
    ) -> int:
        if text_layout and tokenizer:
            output = [section.layout.output for section in layout if section.layout]
            return len(tokenizer.encode(self.separator.join(output)))

        return sum(section.layout.length for section in layout if section.layout)

    def _drop_last_optional_section(self, layout: List[_PromptSectionLayout[Any]]) -> bool:
        for i in reversed(range(len(layout))):
            if not layout[i].section.required:
                del layout[i]
                return True
        return False

    def _needs_more_layout(self, layout: List[_PromptSectionLayout[Any]]) -> bool:
        return any(not section.layout for section in layout)
