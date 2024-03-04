"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from __future__ import annotations

from typing import List

from botbuilder.core import TurnContext

from ....state import MemoryBase
from ...tokenizers import Tokenizer
from ..message import Message
from ..prompt_functions import PromptFunctions
from ..rendered_prompt_section import RenderedPromptSection
from .layout_engine_section import LayoutEngineSection
from .prompt_section import PromptSection
from .prompt_section_base import PromptSectionBase


class GroupSection(PromptSectionBase):
    """
    A group of sections that will rendered as a single message.
    """

    _layout_engine: LayoutEngineSection
    _sections: List[PromptSection]
    _role: str

    def __init__(
        self,
        sections: List[PromptSection],
        role: str = "system",
        tokens: float = -1,
        required: bool = True,
        separator: str = "\n\n",
        text_prefix: str = "",
    ):
        """
        Initializes the GroupSection object.

        Args:
            sections (List[PromptSection]): List of sections to group together.
            role (str, optional): Message role to use for this section. Defaults to `system`.
            tokens (float, optional): Sizing strategy for this section. Defaults to `auto`.
            required (bool, optional): Indicates if this section is required. Defaults to `true`.
            separator (str, optional): Separator to use between sections when rendering as text.
              Defaults to `\n\n`.
            text_prefix (str, optional): Prefix to use for text output. Defaults to ``.
        """
        super().__init__(tokens, required, separator, text_prefix)
        self._layout_engine = LayoutEngineSection(sections, tokens, required, separator)
        self._sections = sections
        self._role = role

    @property
    def sections(self):
        """
        Gets the sections in this group.
        """
        return self._sections

    @property
    def role(self):
        """
        Gets the role for this group.
        """
        return self._role

    async def render_as_messages(
        self,
        context: TurnContext,
        memory: MemoryBase,
        functions: PromptFunctions,
        tokenizer: Tokenizer,
        max_tokens: int,
    ) -> RenderedPromptSection[List[Message]]:
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
        # Render sections to text
        result = await self._layout_engine.render_as_text(
            context, memory, functions, tokenizer, max_tokens
        )

        # Return output as a single message
        return self._return_messages(
            [Message(self.role, result.output)], result.length, tokenizer, max_tokens
        )
