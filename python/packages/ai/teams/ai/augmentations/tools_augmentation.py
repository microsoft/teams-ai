"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from __future__ import annotations

import json
from typing import Dict, List, Optional, Union, cast

from botbuilder.core import TurnContext
from openai.types import chat

from ...state import MemoryBase
from ..models.chat_completion_action import ChatCompletionAction
from ..models.prompt_response import PromptResponse
from ..planners.plan import Plan, PredictedDoCommand, PredictedSayCommand
from ..prompts.message import Message
from ..prompts.sections.prompt_section import PromptSection
from ..tokenizers.tokenizer import Tokenizer
from ..validators.validation import Validation
from .augmentation import Augmentation
from .tools_constants import (
    SUBMIT_TOOL_OUTPUTS_MAP,
    SUBMIT_TOOL_OUTPUTS_MESSAGES,
    SUBMIT_TOOL_OUTPUTS_VARIABLE,
)


class ToolsAugmentation(Augmentation[Union[str, List[chat.ChatCompletionMessageToolCall]]]):
    """
    A server-side 'tools' augmentation.
    """

    _actions: List[ChatCompletionAction] = []

    def __init__(self, actions: Optional[List[ChatCompletionAction]] = None) -> None:
        if actions:
            self._actions = actions

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
        response: PromptResponse[Union[str, List[chat.ChatCompletionMessageToolCall]]],
        remaining_attempts: int,
    ) -> Validation:
        """
        Validates a response to a prompt.

        Args:
            context (TurnContext): Context for the current turn of conversation.
            memory (MemoryBase): Interface for accessing state variables.
            tokenizer (Tokenizer): Tokenizer to use for encoding/decoding text.
            response (PromptResponse[Union[str, List[chat.ChatCompletionMessageToolCall]]]): 
                Response to validate.
            remaining_attempts (int): Nubmer of remaining attempts to validate the response.

        Returns:
            Validation: A 'Validation' object.
        """
        valid_action_tool_calls: List[chat.ChatCompletionMessageToolCall] = []

        if (
            response.message
            and response.message.action_tool_calls
            and len(response.message.action_tool_calls) > 0
            and memory.get(SUBMIT_TOOL_OUTPUTS_VARIABLE) is True
        ):
            tool_calls = response.message.action_tool_calls
            tools = self._actions

            if tools and len(tool_calls) > 0:
                tool_choice = memory.get("temp.tool_choice") or "auto"

                # Calling a single tool
                if isinstance(tool_choice, dict):
                    function_name = tool_choice["function"]["name"]
                    curr_tool_call = tool_calls[0]
                    curr_tool = None

                    for tool in tools:
                        if tool.name == function_name:
                            curr_tool = tool
                            break

                    if curr_tool:
                        # Validate function arguments
                        required_args: List[str] = (
                            curr_tool.parameters["required"]
                            if curr_tool.parameters and "required" in curr_tool.parameters
                            else None
                        )

                        curr_args = json.loads(curr_tool_call.function.arguments)

                        # Contains all required args
                        if required_args:
                            if all(args in curr_args for args in required_args):
                                valid_action_tool_calls.append(curr_tool_call)
                        else:
                            valid_action_tool_calls.append(curr_tool_call)
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
                        required_args = (
                            curr_tool.parameters["required"]
                            if curr_tool.parameters and "required" in curr_tool.parameters
                            else None
                        )

                        curr_args = json.loads(tool_call.function.arguments)

                        if required_args:
                            # Contains all required args
                            if all(args in curr_args for args in required_args):
                                valid_action_tool_calls.append(tool_call)
                        else:
                            valid_action_tool_calls.append(tool_call)

            # No tools were valid
            if len(valid_action_tool_calls) == 0:
                memory.set(SUBMIT_TOOL_OUTPUTS_VARIABLE, False)
                memory.set(SUBMIT_TOOL_OUTPUTS_MAP, {})
                memory.set(SUBMIT_TOOL_OUTPUTS_MESSAGES, {})

            return Validation(
                valid=True,
                value=valid_action_tool_calls if len(valid_action_tool_calls) > 0 else None,
            )
        return Validation(valid=True)

    async def create_plan_from_response(
        self,
        turn_context: TurnContext,
        memory: MemoryBase,
        response: PromptResponse[Union[str, List[chat.ChatCompletionMessageToolCall]]],
    ) -> Plan:
        """
        Creates a plan given validated response value.

        Args:
            turn_context (TurnContext): Context for the current turn of conversation.
            memory (MemoryBase): Interface for accessing state variables.
            response (PromptResponse[Union[str, List[chat.ChatCompletionMessageToolCall]]]):
                The validated and transformed response for the prompt.

        Returns:
            Plan: The created plan.
        """

        tool_map: Dict = {}
        commands: List[Union[PredictedDoCommand, PredictedSayCommand]] = []

        if response.message and response.message.content:
            if memory.get(SUBMIT_TOOL_OUTPUTS_VARIABLE) is True and isinstance(
                response.message.content, list
            ):
                tool_calls: List[chat.ChatCompletionMessageToolCall] = response.message.content

                for tool in tool_calls:
                    tool_map[tool.function.name] = tool.id
                    command = PredictedDoCommand(
                        action=tool.function.name,
                        parameters=json.loads(tool.function.arguments),
                    )
                    commands.append(command)

                memory.set(SUBMIT_TOOL_OUTPUTS_MAP, tool_map)
                return Plan(commands=commands)
            say_response = cast(Message[str], response.message)
            return Plan(commands=[PredictedSayCommand(response=say_response)])
        return Plan()
