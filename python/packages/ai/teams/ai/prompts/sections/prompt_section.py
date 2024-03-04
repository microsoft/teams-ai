"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from typing import List

from botbuilder.core import TurnContext

from ....state import MemoryBase
from ...tokenizers import Tokenizer
from ..message import Message
from ..prompt_functions import PromptFunctions
from ..rendered_prompt_section import RenderedPromptSection


class PromptSection(ABC):
    """
    A section that can be rendered to a prompt as either text or an array of `Message` objects.
    """

    @property
    @abstractmethod
    def required(self) -> bool:
        """
        If true the section is mandatory otherwise it can be safely dropped.
        """

    @property
    @abstractmethod
    def tokens(self) -> float:
        """
        The requested token budget for this section.
        - Values between 0.0 and 1.0 represent a percentage of the total budget and
          the section will be layed out proportionally to all other sections.
        - Values greater than 1.0 represent the max number of tokens the section
          should be allowed to consume.
        """

    @abstractmethod
    async def render_as_text(
        self,
        context: TurnContext,
        memory: MemoryBase,
        functions: PromptFunctions,
        tokenizer: Tokenizer,
        max_tokens: int,
    ) -> "RenderedPromptSection[str]":
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

    @abstractmethod
    async def render_as_messages(
        self,
        context: TurnContext,
        memory: MemoryBase,
        functions: PromptFunctions,
        tokenizer: Tokenizer,
        max_tokens: int,
    ) -> "RenderedPromptSection[List[Message]]":
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
