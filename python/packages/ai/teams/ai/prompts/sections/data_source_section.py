"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from __future__ import annotations

from typing import List

from botbuilder.core import TurnContext

from ....state import MemoryBase
from ...data_sources import DataSource
from ...tokenizers import Tokenizer
from ..message import Message
from ..prompt_functions import PromptFunctions
from ..rendered_prompt_section import RenderedPromptSection
from .prompt_section_base import PromptSectionBase


class DataSourceSection(PromptSectionBase):
    """
    A section that renders a data source to a prompt.
    """

    _data_source: DataSource

    def __init__(self, data_source: DataSource, tokens: float):
        """
        Creates a new `DataSourceSection` instance.

        Args:
            dataSource (DataSource): The data source to render.
            tokens (int): Sizing strategy for this section.
        """
        super().__init__(tokens, True, "\n\n")
        self._data_source = data_source

    async def render_as_messages(
        self,
        context: TurnContext,
        memory: MemoryBase,
        functions: PromptFunctions,
        tokenizer: Tokenizer,
        max_tokens: int,
    ) -> RenderedPromptSection[List[Message[str]]]:
        """
        Renders the section as a list of messages.

        Args:
            context (TurnContext): Context for the current turn of conversation with the user.
            memory (MemoryBase): An interface for accessing state values.
            functions (PromptFunctions): Registry of functions that can be used by the section.
            tokenizer (Tokenizer): Tokenizer to use when rendering the section.
            max_tokens (int): Maximum number of tokens allowed to be rendered.

        Returns:
            RenderedPromptSection[List[Message]]: The rendered prompt section as a list of messages.
        """
        # Render data source
        budget = self._get_token_budget(max_tokens)
        rendered = await self._data_source.render_data(context, memory, tokenizer, budget)

        # Return as a 'system' message
        # - The role will typically end up being ignored because as this section is usually added
        #   to a `GroupSection` which will override the role.
        return RenderedPromptSection(
            output=[Message[str]("system", rendered.output)],
            length=rendered.length,
            too_long=rendered.too_long,
        )
