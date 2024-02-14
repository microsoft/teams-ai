"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from abc import ABC, abstractmethod
from importlib.metadata import version

from botbuilder.core import TurnContext

from ...state import Memory
from ..prompts import PromptFunctions, PromptTemplate
from ..tokenizers import Tokenizer
from .prompt_response import PromptResponse


class PromptCompletionModel(ABC):
    """
    An AI model that can be used to complete prompts.
    """

    @property
    def user_agent(self) -> str:
        return f"teamsai-py/{version('teams-ai')}"

    @abstractmethod
    async def complete_prompt(
        self,
        context: TurnContext,
        memory: Memory,
        functions: PromptFunctions,
        tokenizer: Tokenizer,
        template: PromptTemplate,
    ) -> PromptResponse[str]:
        """
        Completes a prompt.

        Args:
            context (TurnContext): turn context.
            memory (Memory): the turn state.
            functions (PromptFunctions): to use when rendering the prompt.
            tokenizer (Tokenizer): to use when rendering the prompt.
            template (PromptTemplate): template to complete.

        Returns:
            PromptResponse[str]: a response with the status and message.
        """
