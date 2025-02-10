"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from __future__ import annotations

import json
from typing import List, Optional

from botbuilder.core import TurnContext

from ...state import MemoryBase
from ..models.prompt_response import PromptResponse
from ..planners.plan import (
    Plan,
    PredictedCommand,
    PredictedDoCommand,
    PredictedSayCommand,
)
from ..prompts.sections.prompt_section import PromptSection
from ..tokenizers.tokenizer import Tokenizer
from ..validators.validation import Validation
from .augmentation import Augmentation


class ToolsAugmentation(Augmentation[str]):
    """
    A server-side 'tools' augmentation.
    """

    def create_prompt_section(self) -> Optional[PromptSection]:
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
        self,
        turn_context: TurnContext,
        memory: MemoryBase,
        response: PromptResponse[str],
    ) -> Plan:
        """
        Creates a plan given validated response value.

        Args:
            turn_context (TurnContext): Context for the current turn of conversation.
            memory (MemoryBase): Interface for accessing state variables.
            response (PromptResponse[str]):
                The validated and transformed response for the prompt.

        Returns:
            Plan: The created plan.
        """

        commands: List[PredictedCommand] = []

        if response.message and response.message.action_calls:
            tool_calls = response.message.action_calls

            for tool in tool_calls:
                command = PredictedDoCommand(
                    action=tool.function.name,
                    parameters=json.loads(tool.function.arguments),
                    action_id=tool.id,
                )
                commands.append(command)
            return Plan(commands=commands)

        return Plan(commands=[PredictedSayCommand(response=response.message)])
