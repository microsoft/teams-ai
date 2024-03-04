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
from .prompt_section_base import PromptSectionBase


class TextSection(PromptSectionBase):
    """
    A section of text that will be rendered as a message.

    Attributes:
        text (str): Text to use for this section.
        role (str): Message role to use for this section.

    """

    _text: str
    _role: str
    _length: int

    def __init__(
        self,
        text: str,
        role: str,
        tokens: float = -1,
        required: bool = True,
        separator: str = "\n",
        text_prefix: str = "",
    ):
        """
        Creates a new 'TextSection' instance.

        Args:
            text (str): Text to use for this section.
            role (str): Message role to use for this section.
            tokens (float, optional): Sizing strategy for this section. Defaults to `auto`.
            required (bool, optional): Indicates if this section is required. Defaults to `true`.
            separator (str, optional): Separator to use between sections when rendering as text.
              Defaults to `\n`.
            text_prefix (str, optional): Prefix to use for text output. Defaults to ``.

        """
        super().__init__(tokens, required, separator, text_prefix)
        self._text = text
        self._role = role
        self._length = -1

    @property
    def text(self):
        """Text to use for this section."""
        return self._text

    @property
    def role(self):
        """Message role to use for this section."""
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
        # Calculate and cache length
        if self._length < 0:
            self._length = len(tokenizer.encode(self.text))

        # Return output
        messages: List[Message] = [Message(self.role, self.text)] if self._length > 0 else []
        return self._return_messages(messages, self._length, tokenizer, max_tokens)
