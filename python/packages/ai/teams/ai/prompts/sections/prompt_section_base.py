"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from __future__ import annotations

import json
from abc import abstractmethod
from dataclasses import asdict
from typing import Any, List, Union

from botbuilder.core import TurnContext

from ....state import MemoryBase
from ...tokenizers import Tokenizer
from ..message import Message, MessageContentParts, TextContentPart
from ..prompt_functions import PromptFunctions
from ..rendered_prompt_section import RenderedPromptSection
from .prompt_section import PromptSection


class PromptSectionBase(PromptSection):
    """
    Abstract Base class for most prompt sections.

    This class provides a default implementation of `renderAsText()` so that derived classes only
    need to implement `renderAsMessages()`.

    Attributes:
        required (bool): If true the section is mandatory otherwise it can be safely dropped.
        tokens (float): The requested token budget for this section.
        separator (str): The separator to use between messages when rendering as text.
        text_prefix (str): The prefix to use when rendering as text.
    """

    def __init__(
        self,
        tokens: float = -1,
        required: bool = True,
        separator: str = "\n",
        text_prefix: str = "",
    ):
        """Initializes the PromptSectionBase.

        Args:
            tokens (float, optional): Sizing strategy for this section. Defaults to `auto`.
            required (bool, optional): Indicates if this section is required. Defaults to `true`.
            separator (str, optional): Separator to use between sections when rendering as text.
              Defaults to `\n`.
            text_prefix (str, optional): Prefix to use for text output. Defaults to ``.
        """
        self._required = required
        self._tokens = tokens
        self._separator = separator
        self._text_prefix = text_prefix

    @property
    def required(self) -> bool:
        """
        If true the section is mandatory otherwise it can be safely dropped.
        """
        return self._required

    @property
    def tokens(self) -> float:
        """
        The requested token budget for this section.
        - Values between 0.0 and 1.0 represent a percentage of the total budget
          and the section will be layed out proportionally to all other sections.
        - Values greater than 1.0 represent the max number of tokens the section
          should be allowed to consume.
        """
        return self._tokens

    @property
    def separator(self) -> str:
        """
        The separator to use between messages when rendering as text.
        """
        return self._separator

    @property
    def text_prefix(self) -> str:
        """
        The prefix to use when rendering as text.
        """
        return self._text_prefix

    @abstractmethod
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

        # Render as messages
        as_messages: RenderedPromptSection[List[Message[Any]]] = await self.render_as_messages(
            context, memory, functions, tokenizer, max_tokens
        )
        if len(as_messages.output) == 0:
            return RenderedPromptSection("", 0, False)

        # Convert to text
        text = self.separator.join(
            [PromptSectionBase.get_message_text(message) for message in as_messages.output]
        )

        # Calculate length
        prefix_length = len(tokenizer.encode(self.text_prefix))
        separator_length = len(tokenizer.encode(self.separator))
        length = (
            prefix_length + as_messages.length + (len(as_messages.output) - 1) * separator_length
        )

        # Truncate if fixed length
        text = self.text_prefix + text
        if self.tokens > 1.0 and length > self.tokens:
            encoded = tokenizer.encode(text)
            text = tokenizer.decode(encoded[: int(self.tokens)])
            length = int(self.tokens)

        return RenderedPromptSection(text, length, length > max_tokens)

    def _get_token_budget(self, max_tokens: int) -> int:
        return min(int(self.tokens), max_tokens) if self.tokens > 1.0 else max_tokens

    def _return_messages(
        self, output: List[Message], length: int, tokenizer: Tokenizer, max_tokens: int
    ) -> RenderedPromptSection:
        # Truncate if fixed length
        if self.tokens > 1.0:
            while length > self.tokens:
                msg = output.pop()
                encoded = tokenizer.encode(PromptSectionBase.get_message_text(msg))
                length -= len(encoded)
                if length < self.tokens:
                    delta = self.tokens - length
                    truncated = tokenizer.decode(encoded[: int(delta)])
                    output.append(Message(msg.role, truncated))
                    length += int(delta)

        return RenderedPromptSection(output, length, length > max_tokens)

    @staticmethod
    def get_message_text(message: Message) -> str:
        """
        Returns the content of a message as a string.

        Args:
            message (Message): Message to get the text of.

        Returns:
            str: The message content as a string.
        """
        text: Union[List[MessageContentParts], str] = message.content or ""
        if isinstance(text, list):
            text = " ".join([part.text for part in text if isinstance(part, TextContentPart)])
        elif message.function_call:
            text = json.dumps(asdict(message.function_call))
        elif message.name:
            text = f"{message.name} returned {text}"

        return text
