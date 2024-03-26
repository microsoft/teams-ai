"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from __future__ import annotations

import json
from dataclasses import dataclass
from typing import Any, Dict, List, Optional, Union, cast

from botbuilder.core import TurnContext
from dataclasses_json import DataClassJsonMixin, dataclass_json

from ...state import MemoryBase
from ..models.chat_completion_action import ChatCompletionAction
from ..models.prompt_response import PromptResponse
from ..planners.plan import (
    Plan,
    PredictedCommand,
    PredictedDoCommand,
    PredictedSayCommand,
)
from ..prompts.function_call import FunctionCall
from ..prompts.message import Message
from ..prompts.sections.action_augmentation_section import ActionAugmentationSection
from ..prompts.sections.prompt_section import PromptSection
from ..tokenizers import Tokenizer
from ..validators.action_response_validator import ActionResponseValidator
from ..validators.json_response_validator import JSONResponseValidator
from ..validators.validation import Validation
from .augmentation import Augmentation

_MISSING_ACTION_FEEDBACK = (
    'The JSON returned had errors. Apply these fixes:\nadd the "action" property to "instance"'
)
_SAY_REDIRECT_FEEDBACK = """The JSON returned was missing an action. Return a valid JSON
object that contains your thoughts and uses the SAY action."""


@dataclass_json
@dataclass
class Thoughts(DataClassJsonMixin):
    """
    The LLM's thoughts.
    """

    thought: str
    "The LLM's current thought."

    reasoning: str
    "The LLM's reasoning for the current thought."

    plan: str
    "The LLM's plan for the future."


@dataclass_json
@dataclass
class Action(DataClassJsonMixin):
    """
    The next action to perform.
    """

    name: str
    "Name of the action to perform."

    parameters: Optional[Dict[str, Any]] = None
    "Optional. Parameters for the action"


@dataclass_json
@dataclass
class InnerMonologue(DataClassJsonMixin):
    """
    Structure used to track the inner monologue of an LLM.
    """

    thoughts: Thoughts
    action: Action


InnerMonologueSchema: Dict[str, Any] = {
    "type": "object",
    "properties": {
        "thoughts": {
            "type": "object",
            "properties": {
                "thought": {"type": "string", "description": "your current thought"},
                "reasoning": {
                    "type": "string",
                    "description": "self reflect on why you made this decision",
                },
                "plan": {
                    "type": "string",
                    "description": "a short bulleted list that conveys your long-term plan",
                },
            },
            "required": ["thought", "reasoning", "plan"],
        },
        "action": {
            "type": "object",
            "properties": {
                "name": {"type": "string", "description": "name of action to execute"},
                "parameters": {"type": "object", "description": "action parameters"},
            },
            "required": ["name"],
        },
    },
    "required": ["thoughts", "action"],
}
"Json schema for validating an 'InnerMonologue'"


class MonologueAugmentation(Augmentation[InnerMonologue]):
    """
    The 'monologue' augmentation.
    This augmentation adds support for an inner monologue to the prompt.
    The monologue helps the LLM to perform chain-of-thought reasoning
    across multiple turns of conversation.
    """

    _section: ActionAugmentationSection
    _monologue_validator = JSONResponseValidator(
        InnerMonologueSchema,
        """No valid JSON objects were found in the response. Return a 
        valid JSON object with your thoughts and the next 
        action to perform.""",
    )
    _action_validator: ActionResponseValidator

    def __init__(self, actions: List[ChatCompletionAction]) -> None:
        """
        Creates a new 'MonologueAugmentation' instance.

        Args:
        actions (List[ChatCompletionAction]): List of actions supported by the prompt.
        """
        actions = self._append_say_action(actions)
        self._section = ActionAugmentationSection(
            actions=actions,
            # pylint:disable=line-too-long
            call_to_action="\n".join(
                [
                    "Return a JSON object with your thoughts and the next action to perform.",
                    "Only respond with the JSON format below and base your plan on the actions above.",
                    "If you're not sure what to do, you can always say something by returning a SAY action.",
                    "If you're told your JSON response has errors, do your best to fix them.",
                    "Response Format:",
                    '{"thoughts":{"thought":"<your current thought>","reasoning":"<self reflect on why you made this decision>","plan":"- short bulleted\\n- list that conveys\\n- long-term plan"},"action":{"name":"<action name>","parameters":{"<name>":"<value>"}}}',
                ]
            ),
        )
        self._action_validator = ActionResponseValidator(actions, True)

    def create_prompt_section(self) -> Union[PromptSection, None]:
        """
        Creates an optional prompt section for the augmentation

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
            remaining_attempts (int): Number of remaining attempts to validate the response.

        Returns:
        Validation: A 'Validation' object.
        """

        # Validate that we got a well-formed inner monologue
        validation_result = await self._monologue_validator.validate_response(
            context, memory, tokenizer, response, remaining_attempts
        )

        if not validation_result.valid:
            # Catch the case where the action is missing.
            # GPT-3.5 gets stuck in a loop here sometimes
            # so we'll redirect it to just use the SAY action.
            if validation_result.feedback == _MISSING_ACTION_FEEDBACK:
                validation_result.feedback = _SAY_REDIRECT_FEEDBACK
            return validation_result

        # Validate that the action exists and its parameters are valid
        if validation_result.value:
            monologue = InnerMonologue.from_dict(validation_result.value)
            validation_result.value = monologue
            parameters = (
                json.dumps(monologue.action.parameters) if monologue.action.parameters else ""
            )
            message = Message[str](
                role="assistant",
                content=None,
                function_call=FunctionCall(name=monologue.action.name, arguments=parameters),
            )
            action_validation = await self._action_validator.validate_response(
                context,
                memory,
                tokenizer,
                PromptResponse(status="success", message=message),
                remaining_attempts,
            )

            if not action_validation.valid:
                return cast(Any, action_validation)

        return validation_result

    async def create_plan_from_response(
        self,
        turn_context: TurnContext,
        memory: MemoryBase,
        response: PromptResponse[InnerMonologue],
    ) -> Plan:
        """
        Creates a plan given validated response value.

        Args:
            turn_context (TurnContext): Context for the current turn of conversation.
            memory (MemoryBase): Interface for accessing state variables.
            response (PromptResponse): Validated, transformed response for the prompt.

        Returns:
            Plan: The created plan.
        """
        # Identify the action to perform
        if response.message and response.message.content:
            command: PredictedCommand
            # Double encoding/decoding required for class
            monologue = InnerMonologue.from_dict(InnerMonologue.to_dict(response.message.content))

            if monologue.action.name == "SAY":
                params = monologue.action.parameters
                response_val = cast(str, params.get("text")) if params else ""
                command = PredictedSayCommand(response=response_val)
            else:
                command = PredictedDoCommand(
                    action=monologue.action.name,
                    parameters=monologue.action.parameters if monologue.action.parameters else {},
                )
            return Plan(commands=[command])
        return Plan()

    def _append_say_action(self, actions: List[ChatCompletionAction]) -> List[ChatCompletionAction]:
        clone = actions
        clone.append(
            ChatCompletionAction(
                name="SAY",
                description="use to ask the user a question or say something",
                parameters={
                    "type": "object",
                    "properties": {
                        "text": {"type": "string", "description": "text to say or question ask"}
                    },
                    "required": ["text"],
                },
            )
        )
        return clone
