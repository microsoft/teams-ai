"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from __future__ import annotations

from botbuilder.core import TurnContext

from ...state import MemoryBase
from ..models.prompt_response import PromptResponse
from ..tokenizers import Tokenizer
from .prompt_response_validator import PromptResponseValidator
from .validation import Validation


class DefaultResponseValidator(PromptResponseValidator):
    """
    Default response validator that always returns true.
    """

    async def validate_response(
        self,
        context: TurnContext,
        memory: MemoryBase,
        tokenizer: Tokenizer,
        response: PromptResponse,
        remaining_attempts: int,
    ) -> Validation:
        return Validation()
