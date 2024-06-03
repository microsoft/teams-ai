"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from __future__ import annotations

from typing import Union

from botbuilder.core import TurnContext

from ...state import MemoryBase
from ..models.prompt_response import PromptResponse
from ..planners.plan import Plan, PredictedSayCommand
from ..prompts.sections.prompt_section import PromptSection
from ..tokenizers.tokenizer import Tokenizer
from ..validators.validation import Validation
from .augmentation import Augmentation


class DefaultAugmentation(Augmentation[str]):
    """
    The default 'none' augmentation.

    This augmentation does not add any additional functionality to the prompt. It always
    returns a `Plan` with a single `SAY` command containing the models response.
    """

    def create_prompt_section(self) -> Union[PromptSection, None]:
        """
        Creates an optional prompt section for the augmentation.
        """
        return None

    async def validate_response(
        self,
        context: TurnContext,
        memory: MemoryBase,
        tokenizer: Tokenizer,
        response: PromptResponse[str],
        remaining_attempts: int,
    ) -> Validation:
        """
        Validates a response to a prompt.

        Args:
            context (TurnContext): Context for the current turn of conversation.
            memory (MemoryBase): Interface for accessing state variables.
            tokenizer (Tokenizer): Tokenizer to use for encoding/decoding text.
            response (PromptResponse[str]): Response to validate.
            remaining_attempts (int): Nubmer of remaining attempts to validate the response.

        Returns:
            Validation: A 'Validation' object.
        """
        return Validation(valid=True)

    async def create_plan_from_response(
        self, turn_context: TurnContext, memory: MemoryBase, response: PromptResponse[str]
    ) -> Plan:
        """
        Creates a plan given validated response value.

        Args:
            turn_context (TurnContext): Context for the current turn of conversation.
            memory (MemoryBase):  Interface for accessing state variables.
            response (PromptResponse[str]): The validated and transformed response for the prompt.

        Returns:
            Plan: The created plan.
        """
        say_response = ""
        if response.message and response.message.content:
            say_response = response.message.content
        return Plan(commands=[PredictedSayCommand(response=say_response)])
