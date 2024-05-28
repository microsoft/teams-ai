"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from __future__ import annotations

from copy import deepcopy
from typing import List

from botbuilder.core import TurnContext

from ....state import MemoryBase
from ....utils.to_string import to_string
from ...tokenizers import Tokenizer
from ..message import Message
from ..prompt_functions import PromptFunctions
from ..rendered_prompt_section import RenderedPromptSection
from .prompt_section_base import PromptSectionBase


class ConversationHistorySection(PromptSectionBase):
    """
    A section that renders the conversation history.
    """

    _variable: str
    _user_prefix: str
    _assistant_prefix: str

    def __init__(
        self,
        variable: str,
        tokens: float = 1.0,
        required: bool = False,
        user_prefix: str = "user: ",
        assistant_prefix: str = "assistant: ",
        separator: str = "\n",
    ):
        """
        Creates a new `ConversationHistory` instance.

        Args:
            variable (str): Name of memory variable used to store the histories.
            tokens (float, optional): izing strategy for this section. Defaults to `proportional`
              with a value of `1.0`.
            required (bool, optional): Indicates if this section is required. Defaults to `false`.
            user_prefix (str, optional): Prefix to use for user messages when rendering as text.
              Defaults to `user: `.
            assistant_prefix (str, optional): Prefix to use for assistant messages when rendering
              as text. Defaults to `assistant: `.
            separator (str, optional): Separator to use between sections when rendering as text.
              Defaults to `\n`.
        """
        super().__init__(tokens, required, separator)
        self._variable = variable
        self._user_prefix = user_prefix
        self._assistant_prefix = assistant_prefix

    @property
    def variable(self):
        """
        Gets the variable name used to store the conversation history.
        """
        return self._variable

    @property
    def user_prefix(self):
        """
        Gets the prefix used for user messages when rendering as text.
        """
        return self._user_prefix

    @property
    def assistant_prefix(self):
        """
        Gets the prefix used for assistant messages when rendering as text.
        """
        return self._assistant_prefix

    async def render_as_text(
        self,
        context: TurnContext,
        memory: MemoryBase,
        functions: PromptFunctions,
        tokenizer: Tokenizer,
        max_tokens: int,
    ) -> RenderedPromptSection[str]:
        """
        Renders the section as a string of text.

        Args:
            context (TurnContext): Context for the current turn of conversation with the user.
            memory (MemoryBase): An interface for accessing state values.
            functions (PromptFunctions): Registry of functions that can be used by the section.
            tokenizer (Tokenizer): Tokenizer to use when rendering the section.
            max_tokens (int): Maximum number of tokens allowed to be rendered.

        Returns:
            RenderedPromptSection[str]: The rendered prompt section as a string.
        """

        # Get messages from memory
        history: List[Message] = memory.get(self.variable) or []
        history = deepcopy(history)

        # Populate history and stay under the token budget
        tokens = 0
        budget = min(self.tokens, max_tokens) if self.tokens > 1.0 else max_tokens
        separator_length = len(tokenizer.encode(self.separator))
        lines: List[str] = []
        for msg in reversed(history):
            msg = Message(role=msg.role, content=to_string(tokenizer, msg.content))
            prefix = self.user_prefix if msg.role == "user" else self.assistant_prefix
            line = prefix + (msg.content if msg.content is not None else "")
            length = len(tokenizer.encode(line)) + (separator_length if len(lines) > 0 else 0)

            # Add initial line if required
            if len(lines) == 0 and self.required:
                tokens += length
                lines.insert(0, line)
                continue

            # Stop if we're over the token budget
            if tokens + length > budget:
                break

            # Add line
            tokens += length
            lines.insert(0, line)

        return RenderedPromptSection[str](self.separator.join(lines), tokens, tokens > max_tokens)

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

        # Get messages from memory
        history: List[Message] = memory.get(self.variable) or []
        history = deepcopy(history)

        # Populate messages and stay under the token budget
        tokens = 0
        budget = self._get_token_budget(max_tokens)
        messages: List[Message] = []
        for msg in reversed(history):
            # Clone message
            message = deepcopy(msg)
            if message.content is not None:
                message.content = to_string(tokenizer, message.content)

            # Get text message length
            length = len(tokenizer.encode(self.get_message_text(message)))

            # Add length of any image parts
            if isinstance(message.content, list):
                count = 0

                for part in message.content:
                    if not isinstance(part, str) and part.type == "image":
                        count += 1

                length += count * 85

            # Add initial message if required
            if len(messages) == 0 and self.required:
                tokens += length
                messages.insert(0, message)
                continue

            # Stop if we're over the token budget
            if tokens + length > budget:
                break

            # Add message
            tokens += length
            messages.insert(0, message)

        return RenderedPromptSection(messages, tokens, tokens > max_tokens)
