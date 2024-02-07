"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from typing import Generic, TypeVar

from botbuilder.core import TurnContext

from ...state import Memory
from ..models import PromptResponse
from ..tokenizers import Tokenizer
from .prompt_response_validator import PromptResponseValidator
from .validation import Validation

ValueT = TypeVar("ValueT")


class DefaultResponseValidator(Generic[ValueT], PromptResponseValidator[ValueT]):
    """
    Default response validator that always returns true.
    """

    async def validate_response(
        self,
        context: TurnContext,
        memory: Memory,
        tokenizer: Tokenizer,
        response: PromptResponse,
        remaining_attempts: int,
    ) -> Validation[ValueT]:
        return Validation[ValueT]()
