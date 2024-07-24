"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from __future__ import annotations

import json
from typing import List, Optional, Union, cast

from botbuilder.core import TurnContext

from ...state import MemoryBase
from ..models.chat_completion_action import ChatCompletionAction
from ..models.prompt_response import PromptResponse
from ..planners.plan import (
    Plan,
    PredictedCommand,
    PredictedDoCommand,
    PredictedSayCommand,
)
from ..prompts.message import ActionCall, Message
from ..prompts.sections.prompt_section import PromptSection
from ..tokenizers.tokenizer import Tokenizer
from ..validators.validation import Validation
from .augmentation import Augmentation
from .tools_constants import ACTIONS_HISTORY, TOOL_CHOICE


class ToolsAugmentation(Augmentation[Union[str, List[ActionCall]]]):
    """
    A server-side 'tools' augmentation.
    """

    _actions: List[ChatCompletionAction] = []

    def __init__(self, actions: List[ChatCompletionAction] = []) -> None:
        # pylint: disable=dangerous-default-value
        self._actions = actions

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
        response: PromptResponse[Union[str, List[ActionCall]]],
        remaining_attempts: int,
    ) -> Validation:
        """
        Validates a response to a prompt.

        Args:
            context (TurnContext): Context for the current turn of conversation.
            memory (MemoryBase): Interface for accessing state variables.
            tokenizer (Tokenizer): Tokenizer to use for encoding/decoding text.
            response (PromptResponse[Union[str, List[ActionCall]]]):
                Response to validate.
            remaining_attempts (int): Nubmer of remaining attempts to validate the response.

        Returns:
            Validation: A 'Validation' object.
        """
        valid_action_calls: List[ActionCall] = []

        if (
            response.message
            and response.message.action_calls
            and len(response.message.action_calls) > 0
            and memory.has(ACTIONS_HISTORY)
        ):
            tool_calls = response.message.action_calls
            tools = self._actions

            if tools and len(tool_calls) > 0:
                tool_choice = memory.get(TOOL_CHOICE) or "auto"

                # Calling a single tool
                if isinstance(tool_choice, dict):
                    function_name = tool_choice["function"]["name"]
                    tool_call = tool_calls[0]
                    curr_tool = None

                    for tool in tools:
                        if tool.name == function_name:
                            curr_tool = tool
                            break

                    if curr_tool:
                        valid_action_calls = self._validate_function_and_args(
                            curr_tool, tool_call, valid_action_calls
                        )
                    else:
                        return Validation(valid=False, feedback="The invoked tool does not exist.")

                # Calling multiple tools
                else:
                    for tool_call in tool_calls:
                        function_name = tool_call.function.name
                        curr_tool = None

                        for tool in tools:
                            if tool.name == function_name:
                                curr_tool = tool
                                break

                        # Validate function name
                        if not curr_tool:
                            continue

                        # Validate function arguments
                        valid_action_calls = self._validate_function_and_args(
                            curr_tool, tool_call, valid_action_calls
                        )

            # No tools were valid
            if len(valid_action_calls) == 0:
                memory.set(ACTIONS_HISTORY, [])

            return Validation(
                valid=True,
                value=valid_action_calls if len(valid_action_calls) > 0 else None,
            )
        return Validation(valid=True)

    async def create_plan_from_response(
        self,
        turn_context: TurnContext,
        memory: MemoryBase,
        response: PromptResponse[Union[str, List[ActionCall]]],
    ) -> Plan:
        """
        Creates a plan given validated response value.

        Args:
            turn_context (TurnContext): Context for the current turn of conversation.
            memory (MemoryBase): Interface for accessing state variables.
            response (PromptResponse[Union[str, List[ActionCall]]]):
                The validated and transformed response for the prompt.

        Returns:
            Plan: The created plan.
        """

        commands: List[PredictedCommand] = []

        if response.message and response.message.content:
            if memory.has(ACTIONS_HISTORY) and isinstance(response.message.content, list):
                tool_calls: List[ActionCall] = response.message.content

                for tool in tool_calls:
                    command = PredictedDoCommand(
                        action=tool.function.name,
                        parameters=json.loads(tool.function.arguments),
                    )
                    commands.append(command)
                return Plan(commands=commands)
            say_response = cast(Message[str], response.message)
            return Plan(commands=[PredictedSayCommand(response=say_response)])
        return Plan()

    def _validate_function_and_args(
        self,
        curr_tool: ChatCompletionAction,
        tool_call: ActionCall,
        valid_action_calls: List[ActionCall],
    ) -> List[ActionCall]:
        # Validate function arguments
        required_args: List[str] = (
            curr_tool.parameters["required"]
            if curr_tool.parameters and "required" in curr_tool.parameters
            else None
        )

        curr_args = json.loads(tool_call.function.arguments)

        # Contains all required args
        if required_args:
            if all(args in curr_args for args in required_args):
                valid_action_calls.append(tool_call)
        else:
            valid_action_calls.append(tool_call)

        return valid_action_calls
