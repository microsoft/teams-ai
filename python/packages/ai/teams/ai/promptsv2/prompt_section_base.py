"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

import json
from abc import abstractmethod
from dataclasses import asdict
from typing import Any, List, Union

from botbuilder.core import TurnContext

from ...state import Memory
from ..tokenizers import Tokenizer
from .message import Message, MessageContentParts, TextContentPart
from .prompt_functions import PromptFunctions
from .prompt_section import PromptSection
from .rendered_prompt_section import RenderedPromptSection


class PromptSectionBase(PromptSection):
    def __init__(
        self,
        tokens: float = -1,
        required: bool = True,
        separator: str = "\n",
        text_prefix: str = "",
    ):
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

    # pylint: disable=too-many-arguments # No argument can be removed based on the design
    @abstractmethod
    async def render_as_messages(
        self,
        context: TurnContext,
        memory: Memory,
        functions: PromptFunctions,
        tokenizer: Tokenizer,
        max_tokens: int,
    ) -> RenderedPromptSection:
        pass

    # pylint: enable=too-many-arguments

    # pylint: disable=too-many-arguments # No argument can be removed based on the design
    async def render_as_text(
        self,
        context: TurnContext,
        memory: Memory,
        functions: PromptFunctions,
        tokenizer: Tokenizer,
        max_tokens: int,
    ) -> RenderedPromptSection:
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

    # pylint: enable=too-many-arguments

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
        text: Union[List[MessageContentParts], str] = message.content or ""
        if isinstance(text, list):
            text = " ".join([part.text for part in text if isinstance(part, TextContentPart)])
        elif message.function_call:
            text = json.dumps(asdict(message.function_call))
        elif message.name:
            text = f"{message.name} returned {text}"

        return text
