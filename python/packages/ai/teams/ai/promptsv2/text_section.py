"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from typing import List

from botbuilder.core import TurnContext

from ...state import Memory
from ..tokenizers import Tokenizer
from .message import Message
from .prompt_functions import PromptFunctions
from .prompt_section_base import PromptSectionBase
from .rendered_prompt_section import RenderedPromptSection


class TextSection(PromptSectionBase):
    _text: str
    _role: str
    _length: int

    # pylint: disable=too-many-arguments # No argument can be removed based on the design
    def __init__(
        self,
        text: str,
        role: str,
        tokens: float = -1,
        required: bool = True,
        separator: str = "\n",
        text_prefix: str = "",
    ):
        super().__init__(tokens, required, separator, text_prefix)
        self._text = text
        self._role = role
        self._length = -1

    # pylint: enable=too-many-arguments

    @property
    def text(self):
        return self._text

    @property
    def role(self):
        return self._role

    # pylint: disable=too-many-arguments # No argument can be removed based on the design
    async def render_as_messages(
        self,
        context: TurnContext,
        memory: Memory,
        functions: PromptFunctions,
        tokenizer: Tokenizer,
        max_tokens: int,
    ) -> RenderedPromptSection[List[Message]]:
        # Calculate and cache length
        if self._length < 0:
            self._length = len(tokenizer.encode(self.text))

        # Return output
        messages: List[Message] = [Message(self.role, self.text)] if self._length > 0 else []
        return self._return_messages(messages, self._length, tokenizer, max_tokens)

    # pylint: enable=too-many-arguments
