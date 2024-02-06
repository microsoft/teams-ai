"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

import json
from dataclasses import dataclass
from typing import Any, Dict, List, Optional, Union

from botbuilder.core import TurnContext

from teams.ai.augmentations.action_augmentation_section import ActionAugmentationSection
from teams.ai.augmentations.augmentation import Augmentation
from teams.ai.modelsv2 import PromptResponse
from teams.ai.modelsv2.chat_completion_action import ChatCompletionAction
from teams.ai.planner import Plan
from teams.ai.planner.predicted_command import PredictedCommand
from teams.ai.planner.predicted_do_command import PredictedDoCommand
from teams.ai.planner.predicted_say_command import PredictedSayCommand
from teams.ai.promptsv2.function_call import FunctionCall
from teams.ai.promptsv2.message import Message
from teams.ai.promptsv2.prompt_section import PromptSection
from teams.ai.tokenizers import Tokenizer
from teams.ai.validators.action_response_validator import ActionResponseValidator
from teams.ai.validators.json_response_validator import JSONResponseValidator
from teams.ai.validators.validation import Validation
from teams.state import Memory

_MISSING_ACTION_FEEDBACK = (
    'The JSON returned had errors. Apply these fixes:\nadd the "action" property to "instance"'
)
_SAY_REDIRECT_FEEDBACK = """The JSON returned was missing an action. Return a valid JSON
object that contains your thoughts and uses the SAY action."""


@dataclass
class Thoughts:
    """
    The LLM's thoughts.
    """

    thought: str
    "The LLM's current thought."

    reasoning: str
    "The LLM's reasoning for the current thought."

    plan: str
    "The LLM's plan for the future."


@dataclass
class Action:
    """
    The next action to perform.
    """

    name: str
    "Name of the action to perform."

    parameters: Optional[Dict[str, Any]] = None
    "Optional. Parameters for the action"


@dataclass
class InnerMonologue:
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
                "thought": {"type": "string"},
                "reasoning": {"type": "string"},
                "plan": {"type": "string"},
            },
            "required": ["thought", "reasoning", "plan"],
        },
        "action": {
            "type": "object",
            "properties": {"name": {"type": "string"}, "parameters": {"type": "object"}},
            "required": ["name"],
        },
    },
    "required": ["thoughts", "action"],
}
"Json schema for validating an 'InnerMonologue'"


class MonologueAugmentation(Augmentation[Union[InnerMonologue, None]]):
    """
    The 'monologue' augmentation.
    This augmentation adds support for an inner monologue to the prompt.
    The monologue helps the LLM to perform chain-of-thought reasoning
    across multiple turns of conversation.
    """

    _section: ActionAugmentationSection
    _monologue_validator = JSONResponseValidator[InnerMonologue](
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
        memory: Memory,
        tokenizer: Tokenizer,
        response: PromptResponse[str],
        remaining_attempts: int,
    ) -> Validation[Union[InnerMonologue, None]]:
        """
        Validates a response to a prompt.

        Args:
            turn_context (TurnContext): Context for the current turn of conversation.
            memory (Memory): Interface for accessing state variables.
            tokenizer (Tokenizer): Tokenizer to use for encoding/decoding text.
            response (PromptResponse[str]): Response to validate.
            remaining_attempts (int): Number of remaining attempts to validate the response.

        Returns:
        Validation[InnerMonologue]: A 'Validation' object.
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
        monologue = validation_result.value
        parameters = (
            json.dumps(monologue["action"]["parameters"])
            if "parameters" in monologue["action"]
            else {}
        )
        message = Message(
            role="assistant",
            content=None,
            function_call=FunctionCall(name=monologue["action"]["name"], arguments=parameters),
        )
        action_validation = await self._action_validator.validate_response(
            context,
            memory,
            tokenizer,
            PromptResponse(status="success", message=message),
            remaining_attempts,
        )

        if not action_validation.valid:
            return action_validation

        return validation_result

    async def create_plan_from_response(
        self,
        turn_context: TurnContext,
        memory: Memory,
        response: PromptResponse[Union[InnerMonologue, None]],
    ) -> Plan:
        """
        Creates a plan given validated response value.

        Args:
            turn_context (TurnContext): Context for the current turn of conversation.
            memory (Memory): Interface for accessing state variables.
            response (PromptResponse): Validated, transformed response for the prompt.

        Returns:
            Plan: The created plan.
        """
        # Identify the action to perform
        command: PredictedCommand
        monologue = response.message.content

        if monologue.action.name == "SAY":
            command = PredictedSayCommand(response=monologue.action.parameters.get("text"))
        else:
            command = PredictedDoCommand(
                action=monologue.action.name,
                parameters=monologue.action.parameters if monologue.action.parameters else {},
            )
        return Plan(commands=[command])

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
