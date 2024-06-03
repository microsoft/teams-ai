"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from __future__ import annotations

import json
from typing import Any, Dict, List, Optional, Union, cast

from botbuilder.core import TurnContext

from ...state import MemoryBase
from ..models.chat_completion_action import ChatCompletionAction
from ..models.prompt_response import PromptResponse
from ..planners.plan import Plan, PredictedDoCommand, PredictedSayCommand
from ..prompts.function_call import FunctionCall
from ..prompts.message import Message
from ..prompts.sections.action_augmentation_section import ActionAugmentationSection
from ..prompts.sections.prompt_section import PromptSection
from ..tokenizers import Tokenizer
from ..validators.action_response_validator import ActionResponseValidator
from ..validators.json_response_validator import JSONResponseValidator
from ..validators.validation import Validation
from .augmentation import Augmentation

PlanSchema: Optional[Dict[str, Any]] = {
    "type": "object",
    "properties": {
        "type": {"type": "string", "enum": ["plan"]},
        "commands": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "type": {"type": "string", "enum": ["DO", "SAY"]},
                    "action": {"type": "string"},
                    "parameters": {"type": "object"},
                    "response": {"type": "string"},
                },
                "required": ["type"],
            },
            "minItems": 1,
        },
    },
    "required": ["type", "commands"],
}
"JSON schema for a 'Plan'"


class SequenceAugmentation(Augmentation[Plan]):
    """
    The 'sequence' augmentation.
    This augmentation allows the model to return a sequence of actions to perform.
    """

    _section: ActionAugmentationSection
    _plan_validator: JSONResponseValidator = JSONResponseValidator(
        PlanSchema, "Return a JSON object that uses the SAY command to say what you're thinking."
    )
    _action_validator: ActionResponseValidator

    def __init__(self, actions: List[ChatCompletionAction]) -> None:
        self._section = ActionAugmentationSection(
            actions,
            "\n".join(
                [
                    # pylint:disable=line-too-long
                    "Use the actions above to create a plan in the following JSON format:",
                    '{"type":"plan","commands":[{"type":"DO","action":"<name>","parameters":{"<name>":<value>}},{"type":"SAY","response":"<response>"}]}',
                ]
            ),
        )
        self._action_validator = ActionResponseValidator(actions, True)

    def create_prompt_section(self) -> Union[PromptSection, None]:
        """
        Creates an optional prompt section for the augmentation.

        Returns:
        Union[PromptSection, None]: Prompt section
        """
        return self._section

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
            turn_context (TurnContext): Context for the current turn of conversation.
            memory (MemoryBase): Interface for accessing state variables.
            tokenizer (Tokenizer): Tokenizer to use for encoding/decoding text.
            response (PromptResponse[str]): Response to validate.
            remaining_attempts (int): Nubmer of remaining attempts to validate the response.

        Returns:
            Validation: A 'Validation' object.
        """

        # Validate that we got a well-formed inner monologue
        validation_result = await self._plan_validator.validate_response(
            context, memory, tokenizer, response, remaining_attempts
        )

        if not validation_result.valid:
            return validation_result

        # Validate that the plan is structurally correct
        if validation_result.value:
            plan = Plan.from_dict(validation_result.value)
            validation_result.value = plan

            for index, command in enumerate(plan.commands):
                if isinstance(command, PredictedDoCommand):
                    # Ensure that the model specified an action
                    if not command.action:
                        return Validation(
                            valid=False,
                            feedback='The plan JSON is missing the DO "action" for '
                            + f"command[{index}]. Return the name of the action to DO.",
                        )

                    # Ensure that the action is valid
                    parameters: str = ""
                    if command.parameters:
                        parameters = json.dumps(command.parameters)
                    message = Message[str](
                        role="assistant",
                        content=None,
                        function_call=FunctionCall(name=command.action, arguments=parameters),
                    )
                    action_validation = await self._action_validator.validate_response(
                        context,
                        memory,
                        tokenizer,
                        PromptResponse(message=message),
                        remaining_attempts,
                    )

                    if not action_validation.valid:
                        return cast(Any, action_validation)
                elif isinstance(command, PredictedSayCommand):
                    # Ensure that the model specified a response
                    if not command.response:
                        return Validation(
                            valid=False,
                            feedback='The plan JSON is missing the SAY "response" '
                            + f"for command[{index}]. Return the response to SAY.",
                        )
                else:
                    return Validation(
                        valid=False,
                        feedback="The plan JSON contains an unknown command"
                        + f"type of ${command.type}. Only use DO or SAY commands.",
                    )

        # Return the validated monologue
        return validation_result

    async def create_plan_from_response(
        self, turn_context: TurnContext, memory: MemoryBase, response: PromptResponse[Plan]
    ) -> Plan:
        """
        Create a plan given validated response value.

        Args:
            turn_context (TurnContext): Context for the current turn of conversation.
            memory (MemoryBase): Interface for accessing state variables.
            response (PromptResponse): Validated, transformed response for the prompt.

        Returns:
            Plan: The created plan
        """
        if response.message and response.message.content:
            return response.message.content
        return Plan()
