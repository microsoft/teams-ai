"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from __future__ import annotations

from typing import List, Optional

from botbuilder.core import TurnContext

from teams.ai.data_sources.data_source import DataSource
from teams.ai.prompts.rendered_prompt_section import RenderedPromptSection
from teams.ai.tokenizers import Tokenizer
from teams.state.memory import MemoryBase


class TextDataSource(DataSource):
    """
    A data source that can be used to add a static block of text to a prompt.

    .. remarks::
    Primarily used for testing but could be used to inject some externally define text
    into a prompt. The text will be truncated to fit within the `max_tokens` limit.
    """

    _name: str
    _text: str
    _tokens: Optional[List[int]] = None

    def __init__(self, name: str, text: str) -> None:
        """
        Creates a new `TextDataSource` instance.

        Args:
            name (str): Name of the data source.
            text (str): Text to inject into the prompt.
        """
        self._name = name
        self._text = text

    @property
    def name(self) -> str:
        """
        Name of the data source.
        """
        return self._name

    async def render_data(
        self,
        turn_context: TurnContext,
        memory: MemoryBase,
        tokenizer: Tokenizer,
        max_tokens: int,
    ) -> RenderedPromptSection[str]:
        """
        Renders the data source as a string of text.

        Args:
            turn_context (TurnContext): The turn context for current turn of conversation.
            memory (MemoryBase): An interface for accessing state values.
            tokenizer (Tokenizer): Tokenizer to use when rendering the data source.
            max_tokens (int): Maximum number of tokens allowed to be rendered.

        Returns:
            RenderedPromptSection: The text to inject into the prompt as a
            `RenderedPromptSection` object.
        """

        if not self._tokens:  # Tokenize text on first use
            self._tokens = tokenizer.encode(self._text)

        if len(self._tokens) > max_tokens:  # Check for max tokens
            trimmed = self._tokens[0:max_tokens]
            return RenderedPromptSection[str](
                output=tokenizer.decode(trimmed), length=len(trimmed), too_long=True
            )
        return RenderedPromptSection[str](
            output=self._text, length=len(self._tokens), too_long=False
        )
