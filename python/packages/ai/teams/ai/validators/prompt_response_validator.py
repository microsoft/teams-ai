"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from abc import ABC, abstractmethod
from typing import Generic, TypeVar

from botbuilder.core import TurnContext

from ...state import Memory
from ..modelsv2 import PromptResponse
from ..tokenizers import Tokenizer
from .validation import Validation

ValueT = TypeVar("ValueT")


class PromptResponseValidator(ABC, Generic[ValueT]):
    """
    A validator that can be used to validate prompt responses.
    """

    @abstractmethod
    async def validate_response(
        self,
        context: TurnContext,
        memory: Memory,
        tokenizer: Tokenizer,
        response: PromptResponse,
        remaining_attempts: int,
    ) -> Validation[ValueT]:
        """
        Validates a response to a prompt.

        Args:
            context (TurnContext): Context for the current turn of conversation with the user.
            memory (Memory): An interface for accessing state values.
            tokenizer (Tokenizer): Tokenizer to use when rendering the section.
            response (PromptResponse): response Response to validate.
            remaining_attempts (int): Number of remaining attempts to validate the response.

        Returns:
            Validation[TValue]: A `Validation` object.
        """
