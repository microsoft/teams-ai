"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

import asyncio
from typing import Any, Awaitable, Callable, List, Optional

from botbuilder.core import TurnContext

from ...state import Memory
from ..tokenizers import Tokenizer
from .message import Message
from .prompt_functions import PromptFunctions
from .prompt_section import PromptSection
from .prompt_section_layout import PromptSectionLayout
from .rendered_prompt_section import RenderedPromptSection


class LayoutEngine(PromptSection):
    _sections: List[PromptSection]
    _required: bool
    _tokens: int
    _separator: str

    @property
    def sections(self) -> List[PromptSection]:
        return self._sections

    @property
    def required(self) -> bool:
        return self._required

    @property
    def tokens(self) -> int:
        return self._tokens

    @property
    def separator(self) -> str:
        return self._separator

    def __init__(self, sections: List[PromptSection], tokens: int, required: bool, separator: str):
        self._sections = sections
        self._required = required
        self._tokens = tokens
        self._separator = separator

    # pylint: disable=too-many-arguments # No argument can be removed based on the design
    async def render_as_text(
        self,
        context: TurnContext,
        memory: Memory,
        functions: PromptFunctions,
        tokenizer: Tokenizer,
        max_tokens: int,
    ) -> RenderedPromptSection[str]:
        # Start a new layout
        layout: List[PromptSectionLayout[str]] = []
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

    # pylint: enable=too-many-arguments

    # pylint: disable=too-many-arguments # No argument can be removed based on the design
    async def render_as_messages(
        self,
        context: TurnContext,
        memory: Memory,
        functions: PromptFunctions,
        tokenizer: Tokenizer,
        max_tokens: int,
    ) -> RenderedPromptSection[List[Message]]:
        # Start a new layout
        layout: List[PromptSectionLayout[List[Message]]] = []
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

    # pylint: enable=too-many-arguments

    def _add_sections_to_layout(
        self, sections: List[PromptSection], layout: List[PromptSectionLayout[Any]]
    ):
        for section in sections:
            if isinstance(section, LayoutEngine):
                self._add_sections_to_layout(section.sections, layout)
            else:
                layout.append(PromptSectionLayout(section=section))

    # pylint: disable=too-many-arguments # No argument can be removed based on the design
    async def _layout_sections(
        self,
        layout: List[PromptSectionLayout[Any]],
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

    # pylint: enable=too-many-arguments

    async def _layout_fixed_sections(
        self,
        layouts: List[PromptSectionLayout[Any]],
        callback: Callable[[PromptSection], Awaitable[RenderedPromptSection[Any]]],
    ) -> None:
        tasks: List[Awaitable] = []
        for layout in layouts:
            if layout.section.tokens < 0 or layout.section.tokens > 1.0:

                async def task(layout: PromptSectionLayout[Any]) -> None:
                    output = await callback(layout.section)
                    layout.layout = output

                tasks.append(task(layout))

        await asyncio.gather(*tasks)

    async def _layout_proportional_sections(
        self,
        layouts: List[PromptSectionLayout[Any]],
        callback: Callable[[PromptSection], Awaitable[RenderedPromptSection[Any]]],
    ) -> None:
        tasks: List[Awaitable] = []
        for layout in layouts:
            if 0.0 <= layout.section.tokens <= 1.0:

                async def task(layout: PromptSectionLayout[Any]) -> None:
                    output = await callback(layout.section)
                    layout.layout = output

                tasks.append(task(layout))

        await asyncio.gather(*tasks)

    def _get_layout_length(
        self,
        layout: List[PromptSectionLayout[Any]],
        text_layout: bool = False,
        tokenizer: Optional[Tokenizer] = None,
    ) -> int:
        if text_layout and tokenizer:
            output = [section.layout.output for section in layout if section.layout]
            return len(tokenizer.encode(self.separator.join(output)))

        return sum(section.layout.length for section in layout if section.layout)

    def _drop_last_optional_section(self, layout: List[PromptSectionLayout[Any]]) -> bool:
        for i in reversed(range(len(layout))):
            if not layout[i].section.required:
                del layout[i]
                return True
        return False

    def _needs_more_layout(self, layout: List[PromptSectionLayout[Any]]) -> bool:
        return any(not section.layout for section in layout)
