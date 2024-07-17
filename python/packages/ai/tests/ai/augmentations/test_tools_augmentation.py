"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from typing import Dict, List, Union, cast
from unittest import IsolatedAsyncioTestCase

from botbuilder.core import TurnContext
from openai.types import chat
from openai.types.chat.chat_completion_message_tool_call import Function

from teams.ai.augmentations.tools_augmentation import ToolsAugmentation
from teams.ai.augmentations.tools_constants import (
    SUBMIT_TOOL_OUTPUTS_MAP,
    SUBMIT_TOOL_OUTPUTS_VARIABLE,
)
from teams.ai.models.chat_completion_action import ChatCompletionAction
from teams.ai.models.prompt_response import PromptResponse
from teams.ai.planners.plan import PredictedDoCommand, PredictedSayCommand
from teams.ai.prompts.message import Message
from teams.ai.tokenizers.gpt_tokenizer import GPTTokenizer
from teams.state import TurnState


class TestToolsAugmentation(IsolatedAsyncioTestCase):
    def setUp(self):
        self.tokenizer = GPTTokenizer()

    def test_create_prompt_section(self):
        tools_augmentation = ToolsAugmentation()
        self.assertEqual(tools_augmentation.create_prompt_section(), None)

    async def test_validate_str_response(self):
        state = TurnState()
        prompt_response = PromptResponse[Union[str, List[chat.ChatCompletionMessageToolCall]]](
            status="success",
            input=Message(
                role="user",
                content='"Why is the sky blue?"',
                context=None,
                function_call=None,
                name=None,
                action_tool_calls=None,
            ),
            message=Message(
                role="assistant",
                content=(
                    "The sky appears blue because of the way Earth's atmosphere scatters sunlight."
                ),
                context=None,
                function_call=None,
                name=None,
                action_tool_calls=None,
            ),
            error=None,
        )

        tools_augmentation = ToolsAugmentation()
        validation = await tools_augmentation.validate_response(
            cast(TurnContext, {}),
            memory=state,
            tokenizer=self.tokenizer,
            response=prompt_response,
            remaining_attempts=0,
        )
        self.assertEqual(validation.valid, True)
        self.assertEqual(validation.value, None)

    async def test_validate_str_response_with_null_tools_array(self):
        state = TurnState()
        state.temp = {}
        state.set(SUBMIT_TOOL_OUTPUTS_VARIABLE, True)
        prompt_response = PromptResponse[Union[str, List[chat.ChatCompletionMessageToolCall]]](
            status="success",
            input=Message(
                role="user",
                content='"Why is the sky blue?"',
                context=None,
                function_call=None,
                name=None,
                action_tool_calls=None,
            ),
            message=Message(
                role="assistant",
                content=(
                    "The sky appears blue because of the way Earth's atmosphere scatters sunlight."
                ),
                context=None,
                function_call=None,
                name=None,
                action_tool_calls=[],
            ),
            error=None,
        )

        tools_augmentation = ToolsAugmentation()
        validation = await tools_augmentation.validate_response(
            cast(TurnContext, {}),
            memory=state,
            tokenizer=self.tokenizer,
            response=prompt_response,
            remaining_attempts=0,
        )
        self.assertEqual(validation.valid, True)
        self.assertEqual(validation.value, None)

    async def test_validate_tool_call_response_state_not_set(self):
        state = TurnState()
        state.temp = {}
        prompt_response = PromptResponse(
            status="success",
            input=Message(
                role="user",
                content='"hi, can you turn on the lights"',
                context=None,
                function_call=None,
                name=None,
                action_tool_calls=None,
            ),
            message=Message(
                role="assistant",
                content=None,
                context=None,
                function_call=None,
                name=None,
                action_tool_calls=[
                    chat.ChatCompletionMessageToolCall(
                        id="call_3PqbuK5OrvmImKb6VURn2jXz",
                        function=Function(
                            arguments="{}", name="LightsOn"
                        ),
                        type="function",
                    )
                ],
            ),
            error=None,
        )

        tools_augmentation = ToolsAugmentation()
        validation = await tools_augmentation.validate_response(
            cast(TurnContext, {}),
            memory=state,
            tokenizer=self.tokenizer,
            response=prompt_response,
            remaining_attempts=0,
        )
        self.assertEqual(validation.valid, True)
        self.assertEqual(validation.value, None)

    async def test_validate_tool_call_response_missing_tool_actions(self):
        state = TurnState()
        state.temp = {}
        state.set(SUBMIT_TOOL_OUTPUTS_VARIABLE, True)
        prompt_response = PromptResponse(
            status="success",
            input=Message(
                role="user",
                content='"hi, can you turn on the lights"',
                context=None,
                function_call=None,
                name=None,
                action_tool_calls=None,
            ),
            message=Message(
                role="assistant",
                content=None,
                context=None,
                function_call=None,
                name=None,
                action_tool_calls=[
                    chat.ChatCompletionMessageToolCall(
                        id="call_3PqbuK5OrvmImKb6VURn2jXz",
                        function=Function(
                            arguments="{}", name="LightsOn"
                        ),
                        type="function",
                    )
                ],
            ),
            error=None,
        )

        tools_augmentation = ToolsAugmentation()
        validation = await tools_augmentation.validate_response(
            cast(TurnContext, {}),
            memory=state,
            tokenizer=self.tokenizer,
            response=prompt_response,
            remaining_attempts=0,
        )
        self.assertEqual(validation.valid, True)
        self.assertEqual(validation.value, None)
        self.assertEqual(state.get(SUBMIT_TOOL_OUTPUTS_MAP), {})
        self.assertEqual(state.get(SUBMIT_TOOL_OUTPUTS_VARIABLE), False)

    async def test_validate_tool_call_response_single_tool(self):
        state = TurnState()
        state.temp = {}
        state.set(SUBMIT_TOOL_OUTPUTS_VARIABLE, True)
        state.set("temp.tool_choice", {"type": "function", "function": {"name": "LightsOn"}})
        tool_call_one = chat.ChatCompletionMessageToolCall(
            id="call_3PqbuK5OrvmImKb6VURn2jXz",
            function=Function(
                arguments="{}", name="LightsOn"
            ),
            type="function",
        )

        prompt_response = PromptResponse(
            status="success",
            input=Message(
                role="user",
                content='"hi, can you turn on the lights"',
                context=None,
                function_call=None,
                name=None,
                action_tool_calls=None,
            ),
            message=Message(
                role="assistant",
                content=None,
                context=None,
                function_call=None,
                name=None,
                action_tool_calls=[tool_call_one],
            ),
            error=None,
        )

        tools_augmentation = ToolsAugmentation(
            [ChatCompletionAction(name="LightsOn", description="", parameters={})]
        )
        validation = await tools_augmentation.validate_response(
            cast(TurnContext, {}),
            memory=state,
            tokenizer=self.tokenizer,
            response=prompt_response,
            remaining_attempts=0,
        )
        self.assertEqual(validation.valid, True)
        self.assertEqual(validation.value, [tool_call_one])

    async def test_validate_tool_call_response_single_tool_with_params(self):
        state = TurnState()
        state.temp = {}
        state.set(SUBMIT_TOOL_OUTPUTS_VARIABLE, True)
        state.set("temp.tool_choice", {"type": "function", "function": {"name": "Pause"}})
        tool_call_one = chat.ChatCompletionMessageToolCall(
            id="call_Y3M0cw8T8LRuINOiLaQHs5jk",
            function=Function(
                arguments='{"time": 10}', name="Pause"
            ),
            type="function",
        )

        prompt_response = PromptResponse(
            status="success",
            input=Message(
                role="user",
                content='"hi, can you turn on the lights"',
                context=None,
                function_call=None,
                name=None,
                action_tool_calls=None,
            ),
            message=Message(
                role="assistant",
                content=None,
                context=None,
                function_call=None,
                name=None,
                action_tool_calls=[tool_call_one],
            ),
            error=None,
        )

        tools_augmentation = ToolsAugmentation(
            [
                ChatCompletionAction(
                    name="Pause",
                    description="",
                    parameters={
                        "type": "object",
                        "properties": {
                            "time": {
                                "type": "number",
                                "description": "The amount of time to delay in milliseconds",
                            }
                        },
                        "required": ["time"],
                    },
                )
            ]
        )
        validation = await tools_augmentation.validate_response(
            cast(TurnContext, {}),
            memory=state,
            tokenizer=self.tokenizer,
            response=prompt_response,
            remaining_attempts=0,
        )
        self.assertEqual(validation.valid, True)
        self.assertEqual(validation.value, [tool_call_one])

    async def test_validate_tool_call_response_single_tool_missing_params(self):
        state = TurnState()
        state.temp = {}
        state.set(SUBMIT_TOOL_OUTPUTS_VARIABLE, True)
        state.set("temp.tool_choice", {"type": "function", "function": {"name": "Pause"}})
        tool_call_one = chat.ChatCompletionMessageToolCall(
            id="call_Y3M0cw8T8LRuINOiLaQHs5jk",
            function=Function(
                arguments="{}", name="Pause"
            ),
            type="function",
        )

        prompt_response = PromptResponse(
            status="success",
            input=Message(
                role="user",
                content='"hi, can you turn on the lights"',
                context=None,
                function_call=None,
                name=None,
                action_tool_calls=None,
            ),
            message=Message(
                role="assistant",
                content=None,
                context=None,
                function_call=None,
                name=None,
                action_tool_calls=[tool_call_one],
            ),
            error=None,
        )

        tools_augmentation = ToolsAugmentation(
            [
                ChatCompletionAction(
                    name="Pause",
                    description="",
                    parameters={
                        "type": "object",
                        "properties": {
                            "time": {
                                "type": "number",
                                "description": "The amount of time to delay in milliseconds",
                            }
                        },
                        "required": ["time"],
                    },
                )
            ]
        )
        validation = await tools_augmentation.validate_response(
            cast(TurnContext, {}),
            memory=state,
            tokenizer=self.tokenizer,
            response=prompt_response,
            remaining_attempts=0,
        )
        self.assertEqual(validation.valid, True)
        self.assertEqual(validation.value, None)
        self.assertEqual(state.get(SUBMIT_TOOL_OUTPUTS_MAP), {})
        self.assertEqual(state.get(SUBMIT_TOOL_OUTPUTS_VARIABLE), False)

    async def test_validate_tool_call_response_single_tool_missing(self):
        state = TurnState()
        state.temp = {}
        state.set(SUBMIT_TOOL_OUTPUTS_VARIABLE, True)
        state.set("temp.tool_choice", {"type": "function", "function": {"name": "Pause"}})
        tool_call_one = chat.ChatCompletionMessageToolCall(
            id="call_Y3M0cw8T8LRuINOiLaQHs5jk",
            function=Function(
                arguments="{}", name="Pause"
            ),
            type="function",
        )

        prompt_response = PromptResponse(
            status="success",
            input=Message(
                role="user",
                content='"hi, can you turn on the lights"',
                context=None,
                function_call=None,
                name=None,
                action_tool_calls=None,
            ),
            message=Message(
                role="assistant",
                content=None,
                context=None,
                function_call=None,
                name=None,
                action_tool_calls=[tool_call_one],
            ),
            error=None,
        )

        tools_augmentation = ToolsAugmentation(
            [ChatCompletionAction(name="LightsOn", description="", parameters={})]
        )
        validation = await tools_augmentation.validate_response(
            cast(TurnContext, {}),
            memory=state,
            tokenizer=self.tokenizer,
            response=prompt_response,
            remaining_attempts=0,
        )
        self.assertEqual(validation.valid, False)
        self.assertEqual(validation.feedback, "The evoked tool does not exist.")

    async def test_validate_tool_call_response_multiple_tools(self):
        state = TurnState()
        state.temp = {}
        state.set(SUBMIT_TOOL_OUTPUTS_VARIABLE, True)
        tool_call_one = chat.ChatCompletionMessageToolCall(
            id="call_3PqbuK5OrvmImKb6VURn2jXz",
            function=Function(
                arguments="{}", name="LightsOn"
            ),
            type="function",
        )

        prompt_response = PromptResponse(
            status="success",
            input=Message(
                role="user",
                content='"hi, can you turn on the lights"',
                context=None,
                function_call=None,
                name=None,
                action_tool_calls=None,
            ),
            message=Message(
                role="assistant",
                content=None,
                context=None,
                function_call=None,
                name=None,
                action_tool_calls=[tool_call_one],
            ),
            error=None,
        )

        tools_augmentation = ToolsAugmentation(
            [
                ChatCompletionAction(name="LightsOn", description="", parameters={}),
                ChatCompletionAction(name="LightsOff", description="", parameters={}),
            ]
        )
        validation = await tools_augmentation.validate_response(
            cast(TurnContext, {}),
            memory=state,
            tokenizer=self.tokenizer,
            response=prompt_response,
            remaining_attempts=0,
        )
        self.assertEqual(validation.valid, True)
        self.assertEqual(validation.value, [tool_call_one])

    async def test_validate_tool_call_response_multiple_tools_invalid_tool(self):
        state = TurnState()
        state.temp = {}
        state.set(SUBMIT_TOOL_OUTPUTS_VARIABLE, True)
        tool_call_one = chat.ChatCompletionMessageToolCall(
            id="call_3PqbuK5OrvmImKb6VURn2jXz",
            function=Function(
                arguments="{}", name="Lights"
            ),
            type="function",
        )

        prompt_response = PromptResponse(
            status="success",
            input=Message(
                role="user",
                content='"hi, can you turn on the lights"',
                context=None,
                function_call=None,
                name=None,
                action_tool_calls=None,
            ),
            message=Message(
                role="assistant",
                content=None,
                context=None,
                function_call=None,
                name=None,
                action_tool_calls=[tool_call_one],
            ),
            error=None,
        )

        tools_augmentation = ToolsAugmentation(
            [
                ChatCompletionAction(name="LightsOn", description="", parameters={}),
                ChatCompletionAction(name="LightsOff", description="", parameters={}),
            ]
        )
        validation = await tools_augmentation.validate_response(
            cast(TurnContext, {}),
            memory=state,
            tokenizer=self.tokenizer,
            response=prompt_response,
            remaining_attempts=0,
        )
        self.assertEqual(validation.valid, True)
        self.assertEqual(validation.value, None)
        self.assertEqual(state.get(SUBMIT_TOOL_OUTPUTS_MAP), {})
        self.assertEqual(state.get(SUBMIT_TOOL_OUTPUTS_VARIABLE), False)

    async def test_validate_tool_call_response_multiple_tools_with_params(self):
        state = TurnState()
        state.temp = {}
        state.set(SUBMIT_TOOL_OUTPUTS_VARIABLE, True)
        tool_call_one = chat.ChatCompletionMessageToolCall(
            id="call_Y3M0cw8T8LRuINOiLaQHs5jk",
            function=Function(
                arguments='{"time": 10}', name="Pause"
            ),
            type="function",
        )
        tool_call_two = chat.ChatCompletionMessageToolCall(
            id="call_3PqbuK5OrvmImKb6VURn2jXz",
            function=Function(
                arguments="{}", name="LightsOn"
            ),
            type="function",
        )

        prompt_response = PromptResponse(
            status="success",
            input=Message(
                role="user",
                content='"hi, can you turn on the lights"',
                context=None,
                function_call=None,
                name=None,
                action_tool_calls=None,
            ),
            message=Message(
                role="assistant",
                content=None,
                context=None,
                function_call=None,
                name=None,
                action_tool_calls=[tool_call_one, tool_call_two],
            ),
            error=None,
        )

        tools_augmentation = ToolsAugmentation(
            [
                ChatCompletionAction(name="LightsOn", description="", parameters={}),
                ChatCompletionAction(
                    name="Pause",
                    description="",
                    parameters={
                        "type": "object",
                        "properties": {
                            "time": {
                                "type": "number",
                                "description": "The amount of time to delay in milliseconds",
                            }
                        },
                        "required": ["time"],
                    },
                ),
            ]
        )
        validation = await tools_augmentation.validate_response(
            cast(TurnContext, {}),
            memory=state,
            tokenizer=self.tokenizer,
            response=prompt_response,
            remaining_attempts=0,
        )
        self.assertEqual(validation.valid, True)
        self.assertEqual(validation.value, [tool_call_one, tool_call_two])

    async def test_validate_tool_call_response_multiple_tools_missing_params(self):
        state = TurnState()
        state.temp = {}
        state.set(SUBMIT_TOOL_OUTPUTS_VARIABLE, True)
        tool_call_one = chat.ChatCompletionMessageToolCall(
            id="call_Y3M0cw8T8LRuINOiLaQHs5jk",
            function=Function(
                arguments="{}", name="Pause"
            ),
            type="function",
        )
        tool_call_two = chat.ChatCompletionMessageToolCall(
            id="call_3PqbuK5OrvmImKb6VURn2jXz",
            function=Function(
                arguments="{}", name="LightsOn"
            ),
            type="function",
        )

        prompt_response = PromptResponse(
            status="success",
            input=Message(
                role="user",
                content='"hi, can you turn on the lights"',
                context=None,
                function_call=None,
                name=None,
                action_tool_calls=None,
            ),
            message=Message(
                role="assistant",
                content=None,
                context=None,
                function_call=None,
                name=None,
                action_tool_calls=[tool_call_one, tool_call_two],
            ),
            error=None,
        )

        tools_augmentation = ToolsAugmentation(
            [
                ChatCompletionAction(name="LightsOn", description="", parameters={}),
                ChatCompletionAction(
                    name="Pause",
                    description="",
                    parameters={
                        "type": "object",
                        "properties": {
                            "time": {
                                "type": "number",
                                "description": "The amount of time to delay in milliseconds",
                            }
                        },
                        "required": ["time"],
                    },
                ),
            ]
        )
        validation = await tools_augmentation.validate_response(
            cast(TurnContext, {}),
            memory=state,
            tokenizer=self.tokenizer,
            response=prompt_response,
            remaining_attempts=0,
        )
        self.assertEqual(validation.valid, True)
        self.assertEqual(validation.value, [tool_call_two])

    async def test_create_plan_from_response_missing_response_message(self):
        state = TurnState()
        state.temp = {}
        state.set(SUBMIT_TOOL_OUTPUTS_VARIABLE, False)

        tools_augmentation = ToolsAugmentation()
        plan = await tools_augmentation.create_plan_from_response(
            cast(TurnContext, {}),
            memory=state,
            response=PromptResponse(
                status="success",
                input=Message(
                    role="user",
                    content='"hi, can you turn on the lights"',
                    context=None,
                    function_call=None,
                    name=None,
                    action_tool_calls=None,
                ),
                message=None,
            ),
        )

        self.assertEqual(len(plan.commands), 0)

    async def test_create_plan_from_response_with_tool_set_false(self):
        state = TurnState()
        state.temp = {}
        state.set(SUBMIT_TOOL_OUTPUTS_VARIABLE, False)
        tool_call_one = chat.ChatCompletionMessageToolCall(
            id="call_3PqbuK5OrvmImKb6VURn2jXz",
            function=Function(
                arguments="{}", name="LightsOn"
            ),
            type="function",
        )
        tools = [tool_call_one]

        tools_augmentation = ToolsAugmentation()
        plan = await tools_augmentation.create_plan_from_response(
            cast(TurnContext, {}),
            memory=state,
            response=PromptResponse(
                status="success",
                input=Message(
                    role="user",
                    content='"hi, can you turn on the lights"',
                    context=None,
                    function_call=None,
                    name=None,
                    action_tool_calls=None,
                ),
                message=Message(
                    role="assistant",
                    content=tools,
                    context=None,
                    function_call=None,
                    name=None,
                    action_tool_calls=tools,
                ),
                error=None,
            ),
        )

        self.assertEqual(len(plan.commands), 1)
        self.assertEqual(plan.commands[0].type, "SAY")
        assert isinstance(plan.commands[0], PredictedSayCommand)
        self.assertEqual(
            plan.commands[0].response,
            Message(
                role="assistant",
                content=tools,
                context=None,
                function_call=None,
                name=None,
                action_tool_calls=tools,
            ),
        )

    async def test_create_plan_from_response_with_tool_set_true(self):
        state = TurnState()
        state.temp = {}
        state.set(SUBMIT_TOOL_OUTPUTS_VARIABLE, True)
        tool_call_one = chat.ChatCompletionMessageToolCall(
            id="call_3PqbuK5OrvmImKb6VURn2jXz",
            function=Function(
                arguments="{}", name="LightsOn"
            ),
            type="function",
        )
        tools = [tool_call_one]

        tools_augmentation = ToolsAugmentation()
        plan = await tools_augmentation.create_plan_from_response(
            cast(TurnContext, {}),
            memory=state,
            response=PromptResponse(
                status="success",
                input=Message(
                    role="user",
                    content='"hi, can you turn on the lights"',
                    context=None,
                    function_call=None,
                    name=None,
                    action_tool_calls=None,
                ),
                message=Message(
                    role="assistant",
                    content=tools,
                    context=None,
                    function_call=None,
                    name=None,
                    action_tool_calls=tools,
                ),
                error=None,
            ),
        )

        self.assertEqual(len(plan.commands), 1)
        self.assertEqual(plan.commands[0].type, "DO")
        assert isinstance(plan.commands[0], PredictedDoCommand)
        self.assertEqual(plan.commands[0].action, "LightsOn")
        self.assertEqual(plan.commands[0].parameters, {})

        tool_map = cast(Dict[str, chat.ChatCompletionToolMessageParam],
                        state.get(SUBMIT_TOOL_OUTPUTS_MAP))
        self.assertTrue("LightsOn" in tool_map)
        self.assertEqual(tool_map["LightsOn"], "call_3PqbuK5OrvmImKb6VURn2jXz")

    async def test_create_plan_from_response_with_multiple_tools(self):
        state = TurnState()
        state.temp = {}
        state.set(SUBMIT_TOOL_OUTPUTS_VARIABLE, True)
        tool_call_one = chat.ChatCompletionMessageToolCall(
            id="call_Y3M0cw8T8LRuINOiLaQHs5jk",
            function=Function(
                arguments='{"time": 10}', name="Pause"
            ),
            type="function",
        )
        tool_call_two = chat.ChatCompletionMessageToolCall(
            id="call_3PqbuK5OrvmImKb6VURn2jXz",
            function=Function(
                arguments="{}", name="LightsOn"
            ),
            type="function",
        )
        tools = [tool_call_one, tool_call_two]

        tools_augmentation = ToolsAugmentation()
        plan = await tools_augmentation.create_plan_from_response(
            cast(TurnContext, {}),
            memory=state,
            response=PromptResponse(
                status="success",
                input=Message(
                    role="user",
                    content='"hi, can you turn on the lights"',
                    context=None,
                    function_call=None,
                    name=None,
                    action_tool_calls=None,
                ),
                message=Message(
                    role="assistant",
                    content=tools,
                    context=None,
                    function_call=None,
                    name=None,
                    action_tool_calls=tools,
                ),
                error=None,
            ),
        )

        self.assertEqual(len(plan.commands), 2)
        self.assertEqual(plan.commands[0].type, "DO")
        assert isinstance(plan.commands[0], PredictedDoCommand)
        self.assertEqual(plan.commands[0].action, "Pause")
        self.assertEqual(plan.commands[0].parameters, {"time": 10})
        self.assertEqual(plan.commands[1].type, "DO")
        assert isinstance(plan.commands[1], PredictedDoCommand)
        self.assertEqual(plan.commands[1].action, "LightsOn")
        self.assertEqual(plan.commands[1].parameters, {})

        tool_map = cast(Dict[str, chat.ChatCompletionToolMessageParam],
                        state.get(SUBMIT_TOOL_OUTPUTS_MAP))
        self.assertTrue("Pause" in tool_map)
        self.assertEqual(tool_map, "call_Y3M0cw8T8LRuINOiLaQHs5jk")
        self.assertTrue("LightsOn" in tool_map)
        self.assertEqual(tool_map["LightsOn"], "call_3PqbuK5OrvmImKb6VURn2jXz")
