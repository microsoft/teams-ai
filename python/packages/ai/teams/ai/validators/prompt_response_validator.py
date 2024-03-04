"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from __future__ import annotations

from abc import ABC, abstractmethod

from botbuilder.core import TurnContext

from ...state import MemoryBase
from ..models.prompt_response import PromptResponse
from ..tokenizers import Tokenizer
from .validation import Validation


class PromptResponseValidator(ABC):
    """
    A validator that can be used to validate prompt responses.
    """

    @abstractmethod
    async def validate_response(
        self,
        context: TurnContext,
        memory: MemoryBase,
        tokenizer: Tokenizer,
        response: PromptResponse,
        remaining_attempts: int,
    ) -> Validation:
        """
        Validates a response to a prompt.

        Args:
            context (TurnContext): Context for the current turn of conversation with the user.
            memory (MemoryBase): An interface for accessing state values.
            tokenizer (Tokenizer): Tokenizer to use when rendering the section.
            response (PromptResponse): response Response to validate.
            remaining_attempts (int): Number of remaining attempts to validate the response.

        Returns:
            Validation: A `Validation` object.
        """
