"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from abc import ABC, abstractmethod

from botbuilder.core import TurnContext

from teams.ai.prompts.prompt_section import RenderedPromptSection
from teams.ai.tokenizers import Tokenizer
from teams.memory_fork import Memory


class DataSource(ABC):
    """
    A data source that can be used to render text that's added to a prompt.
    """

    name: str
    "Name of the data source."

    @abstractmethod
    async def render_data(
        self,
        turn_context: TurnContext,
        memory: Memory,
        tokenizer: Tokenizer,
        max_tokens: int,
    ) -> RenderedPromptSection[str]:
        """
        Renders the data source as a string of text.

        Args:
            turn_context (TurnContext): The turn context for current turn of conversation.
            memory (Memory): An interface for accessing state values.
            tokenizer (Tokenizer): Tokenizer to use when rendering the data source.
            max_tokens (int): Maximum number of tokens allowed to be rendered.

        Returns:
            RenderedPromptSection: The text to inject into the prompt as a 
            `RenderedPromptSection` object.
        """
