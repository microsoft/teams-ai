"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from __future__ import annotations

from abc import ABC, abstractmethod

from botbuilder.core import TurnContext

from ...state import MemoryBase
from ...user_agent import _UserAgent
from ..prompts.prompt_functions import PromptFunctions
from ..prompts.prompt_template import PromptTemplate
from ..tokenizers import Tokenizer
from .prompt_response import PromptResponse


class PromptCompletionModel(ABC, _UserAgent):
    """
    An AI model that can be used to complete prompts.
    """

    @abstractmethod
    async def complete_prompt(
        self,
        context: TurnContext,
        memory: MemoryBase,
        functions: PromptFunctions,
        tokenizer: Tokenizer,
        template: PromptTemplate,
    ) -> PromptResponse[str]:
        """
        Completes a prompt.

        Args:
            context (TurnContext): turn context.
            memory (MemoryBase): the turn state.
            functions (PromptFunctions): to use when rendering the prompt.
            tokenizer (Tokenizer): to use when rendering the prompt.
            template (PromptTemplate): template to complete.

        Returns:
            PromptResponse[str]: a response with the status and message.
        """
