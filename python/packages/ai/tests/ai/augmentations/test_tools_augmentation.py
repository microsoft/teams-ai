"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from typing import List, Union, cast
from unittest import IsolatedAsyncioTestCase

from botbuilder.core import TurnContext
from openai.types import chat
from openai.types.chat.chat_completion_message_tool_call_param import Function

from teams.ai.augmentations.tools_augmentation import ToolsAugmentation
from teams.ai.augmentations.tools_constants import ACTIONS_HISTORY, TOOL_CHOICE
from teams.ai.models.chat_completion_action import ChatCompletionAction
from teams.ai.models.prompt_response import PromptResponse
from teams.ai.planners.plan import PredictedDoCommand, PredictedSayCommand
from teams.ai.prompts.message import ActionCall, ActionFunction, Message
from teams.ai.tokenizers.gpt_tokenizer import GPTTokenizer
from teams.state import TurnState

action_call_one = ActionCall(
    id="1",
    type="function",
    function=ActionFunction(
        name="LightsOn",
        arguments="{}",
    ),
)
chat_completion_tool_one = chat.ChatCompletionMessageToolCallParam(
    id="1",
    function=Function(
        name="LightsOn",
        arguments="{}",
    ),
    type="function",
)
action_call_two = ActionCall(
    id="2",
    function=ActionFunction(arguments='{"time": 10}', name="Pause"),
    type="function",
)
chat_completion_tool_two = chat.ChatCompletionMessageToolCallParam(
    id="2",
    function=Function(
        name="Pause",
        arguments='{"time": 10}',
    ),
    type="function",
)
action_call_two_missing_params = ActionCall(
    id="2",
    function=ActionFunction(arguments="{}", name="Pause"),
    type="function",
)
chat_completion_tool_two_missing_params = chat.ChatCompletionMessageToolCallParam(
    id="2",
    function=Function(
        name="Pause",
        arguments="",
    ),
    type="function",
)
action_call_three = ActionCall(
    id="3",
    type="function",
    function=ActionFunction(
        name="Lights",
        arguments="{}",
    ),
)
chat_completion_tool_three = chat.ChatCompletionMessageToolCallParam(
    id="3",
    function=Function(
        name="Lights",
        arguments="{}",
    ),
    type="function",
)


class TestToolsAugmentation(IsolatedAsyncioTestCase):
    def setUp(self):
        self.tokenizer = GPTTokenizer()

    def test_create_prompt_section(self):
        tools_augmentation = ToolsAugmentation()
        self.assertEqual(tools_augmentation.create_prompt_section(), None)

    async def test_validate_str_response(self):
        state = TurnState()
        state.conversation = {}
        state.temp = {}
        prompt_response = PromptResponse[Union[str, List[ActionCall]]](
            status="success",
            input=Message(
                role="user",
                content='"Why is the sky blue?"',
                context=None,
                function_call=None,
                name=None,
                action_calls=None,
            ),
            message=Message(
                role="assistant",
                content=(
                    "The sky appears blue because of the way Earth's atmosphere scatters sunlight."
                ),
                context=None,
                function_call=None,
                name=None,
                action_calls=None,
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
        state.conversation = {}
        state.temp = {}
        state.set(
            ACTIONS_HISTORY,
            [
                chat.ChatCompletionAssistantMessageParam(
                    role="assistant", tool_calls=[chat_completion_tool_one]
                )
            ],
        )
        prompt_response = PromptResponse[Union[str, List[ActionCall]]](
            status="success",
            input=Message(
                role="user",
                content='"Why is the sky blue?"',
                context=None,
                function_call=None,
                name=None,
                action_calls=None,
            ),
            message=Message(
                role="assistant",
                content=(
                    "The sky appears blue because of the way Earth's atmosphere scatters sunlight."
                ),
                context=None,
                function_call=None,
                name=None,
                action_calls=[],
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

    async def test_validate_tool_history_state_not_set(self):
        state = TurnState()
        state.temp = {}
        state.conversation = {}
        prompt_response = PromptResponse(
            status="success",
            input=Message(
                role="user",
                content='"hi, can you turn on the lights"',
                context=None,
                function_call=None,
                name=None,
                action_calls=None,
            ),
            message=Message(
                role="assistant",
                content=None,
                context=None,
                function_call=None,
                name=None,
                action_calls=[
                    ActionCall(
                        id="1",
                        function=ActionFunction(arguments="{}", name="LightsOn"),
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
        state.conversation = {}
        state.temp = {}
        state.set(
            ACTIONS_HISTORY,
            [
                chat.ChatCompletionAssistantMessageParam(
                    role="assistant", tool_calls=[chat_completion_tool_one]
                )
            ],
        )
        prompt_response = PromptResponse(
            status="success",
            input=Message(
                role="user",
                content='"hi, can you turn on the lights"',
                context=None,
                function_call=None,
                name=None,
                action_calls=None,
            ),
            message=Message(
                role="assistant",
                content=None,
                context=None,
                function_call=None,
                name=None,
                action_calls=[action_call_one],
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
        if state.get(ACTIONS_HISTORY):
            history = cast(List[chat.ChatCompletionMessageParam], state.get(ACTIONS_HISTORY))
            self.assertEqual(len(history), 0)

    async def test_validate_tool_call_response_single_tool(self):
        state = TurnState()
        state.conversation = {}
        state.temp = {}
        state.set(
            ACTIONS_HISTORY,
            [
                chat.ChatCompletionAssistantMessageParam(
                    role="assistant", tool_calls=[chat_completion_tool_one]
                )
            ],
        )
        state.set(TOOL_CHOICE, {"type": "function", "function": {"name": "LightsOn"}})

        prompt_response = PromptResponse(
            status="success",
            input=Message(
                role="user",
                content='"hi, can you turn on the lights"',
                context=None,
                function_call=None,
                name=None,
                action_calls=None,
            ),
            message=Message(
                role="assistant",
                content=None,
                context=None,
                function_call=None,
                name=None,
                action_calls=[action_call_one],
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
        self.assertEqual(validation.value, [action_call_one])

    async def test_validate_tool_call_response_single_tool_with_params(self):
        state = TurnState()
        state.conversation = {}
        state.temp = {}
        state.set(
            ACTIONS_HISTORY,
            [
                chat.ChatCompletionAssistantMessageParam(
                    role="assistant", tool_calls=[chat_completion_tool_two]
                )
            ],
        )
        state.set(TOOL_CHOICE, {"type": "function", "function": {"name": "Pause"}})

        prompt_response = PromptResponse(
            status="success",
            input=Message(
                role="user",
                content='"hi, can you turn on the lights"',
                context=None,
                function_call=None,
                name=None,
                action_calls=None,
            ),
            message=Message(
                role="assistant",
                content=None,
                context=None,
                function_call=None,
                name=None,
                action_calls=[action_call_two],
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
        self.assertEqual(validation.value, [action_call_two])

    async def test_validate_tool_call_response_single_tool_missing_params(self):
        state = TurnState()
        state.conversation = {}
        state.temp = {}
        state.set(
            ACTIONS_HISTORY,
            [
                chat.ChatCompletionAssistantMessageParam(
                    role="assistant", tool_calls=[chat_completion_tool_two_missing_params]
                )
            ],
        )
        state.set(TOOL_CHOICE, {"type": "function", "function": {"name": "Pause"}})

        prompt_response = PromptResponse(
            status="success",
            input=Message(
                role="user",
                content='"hi, can you turn on the lights"',
                context=None,
                function_call=None,
                name=None,
                action_calls=None,
            ),
            message=Message(
                role="assistant",
                content=None,
                context=None,
                function_call=None,
                name=None,
                action_calls=[action_call_two_missing_params],
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
        if state.get(ACTIONS_HISTORY):
            history = cast(List[chat.ChatCompletionMessageParam], state.get(ACTIONS_HISTORY))
            self.assertEqual(len(history), 0)

    async def test_validate_tool_call_response_single_tool_missing(self):
        state = TurnState()
        state.conversation = {}
        state.temp = {}
        state.set(
            ACTIONS_HISTORY,
            [
                chat.ChatCompletionAssistantMessageParam(
                    role="assistant", tool_calls=[chat_completion_tool_two]
                )
            ],
        )
        state.set(TOOL_CHOICE, {"type": "function", "function": {"name": "Pause"}})

        prompt_response = PromptResponse(
            status="success",
            input=Message(
                role="user",
                content='"hi, can you turn on the lights"',
                context=None,
                function_call=None,
                name=None,
                action_calls=None,
            ),
            message=Message(
                role="assistant",
                content=None,
                context=None,
                function_call=None,
                name=None,
                action_calls=[action_call_two],
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
        self.assertEqual(validation.feedback, "The invoked tool does not exist.")

    async def test_validate_tool_call_response_multiple_tools(self):
        state = TurnState()
        state.conversation = {}
        state.temp = {}
        state.set(
            ACTIONS_HISTORY,
            [
                chat.ChatCompletionAssistantMessageParam(
                    role="assistant", tool_calls=[chat_completion_tool_one]
                )
            ],
        )

        prompt_response = PromptResponse(
            status="success",
            input=Message(
                role="user",
                content='"hi, can you turn on the lights"',
                context=None,
                function_call=None,
                name=None,
                action_calls=None,
            ),
            message=Message(
                role="assistant",
                content=None,
                context=None,
                function_call=None,
                name=None,
                action_calls=[action_call_one],
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
        self.assertEqual(validation.value, [action_call_one])

    async def test_validate_tool_call_response_multiple_tools_invalid_tool(self):
        state = TurnState()
        state.conversation = {}
        state.temp = {}
        state.set(
            ACTIONS_HISTORY,
            [
                chat.ChatCompletionAssistantMessageParam(
                    role="assistant", tool_calls=[chat_completion_tool_three]
                )
            ],
        )

        prompt_response = PromptResponse(
            status="success",
            input=Message(
                role="user",
                content='"hi, can you turn on the lights"',
                context=None,
                function_call=None,
                name=None,
                action_calls=None,
            ),
            message=Message(
                role="assistant",
                content=None,
                context=None,
                function_call=None,
                name=None,
                action_calls=[action_call_three],
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
        if state.get(ACTIONS_HISTORY):
            history = cast(List[chat.ChatCompletionMessageParam], state.get(ACTIONS_HISTORY))
            self.assertEqual(len(history), 0)

    async def test_validate_tool_call_response_multiple_tools_with_params(self):
        state = TurnState()
        state.temp = {}
        state.conversation = {}
        state.temp = {}
        state.set(
            ACTIONS_HISTORY,
            [
                chat.ChatCompletionAssistantMessageParam(
                    role="assistant",
                    tool_calls=[chat_completion_tool_one, chat_completion_tool_two],
                )
            ],
        )

        prompt_response = PromptResponse(
            status="success",
            input=Message(
                role="user",
                content='"hi, can you turn on the lights"',
                context=None,
                function_call=None,
                name=None,
                action_calls=None,
            ),
            message=Message(
                role="assistant",
                content=None,
                context=None,
                function_call=None,
                name=None,
                action_calls=[action_call_one, action_call_two],
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
        self.assertEqual(validation.value, [action_call_one, action_call_two])

    async def test_validate_tool_call_response_multiple_tools_missing_params(self):
        state = TurnState()
        state.conversation = {}
        state.temp = {}
        state.set(
            ACTIONS_HISTORY,
            [
                chat.ChatCompletionAssistantMessageParam(
                    role="assistant",
                    tool_calls=[chat_completion_tool_one, chat_completion_tool_two_missing_params],
                )
            ],
        )

        prompt_response = PromptResponse(
            status="success",
            input=Message(
                role="user",
                content='"hi, can you turn on the lights"',
                context=None,
                function_call=None,
                name=None,
                action_calls=None,
            ),
            message=Message(
                role="assistant",
                content=None,
                context=None,
                function_call=None,
                name=None,
                action_calls=[action_call_one, action_call_two_missing_params],
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
        self.assertEqual(validation.value, [action_call_one])

    async def test_create_plan_from_response_missing_response_message(self):
        state = TurnState()
        state.temp = {}
        state.conversation = {}

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
                    action_calls=None,
                ),
                message=None,
            ),
        )

        self.assertEqual(len(plan.commands), 0)

    async def test_create_plan_from_response_with_no_tool_history(self):
        state = TurnState()
        state.temp = {}
        state.conversation = {}

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
                    action_calls=None,
                ),
                message=Message(
                    role="assistant",
                    content=[action_call_one],
                    context=None,
                    function_call=None,
                    name=None,
                    action_calls=[action_call_one],
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
                content=[action_call_one],
                context=None,
                function_call=None,
                name=None,
                action_calls=[action_call_one],
            ),
        )

    async def test_create_plan_from_response_with_tool_set_true(self):
        state = TurnState()
        state.temp = {}
        state.conversation = {}
        state.set(
            ACTIONS_HISTORY,
            [
                chat.ChatCompletionAssistantMessageParam(
                    role="assistant", tool_calls=[chat_completion_tool_one]
                )
            ],
        )

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
                    action_calls=None,
                ),
                message=Message(
                    role="assistant",
                    content=[action_call_one],
                    context=None,
                    function_call=None,
                    name=None,
                    action_calls=[action_call_one],
                ),
                error=None,
            ),
        )

        self.assertEqual(len(plan.commands), 1)
        self.assertEqual(plan.commands[0].type, "DO")
        assert isinstance(plan.commands[0], PredictedDoCommand)
        self.assertEqual(plan.commands[0].action, "LightsOn")
        self.assertEqual(plan.commands[0].parameters, {})

    async def test_create_plan_from_response_with_multiple_tools(self):
        state = TurnState()
        state.temp = {}
        state.conversation = {}
        state.set(
            ACTIONS_HISTORY,
            [
                chat.ChatCompletionAssistantMessageParam(
                    role="assistant",
                    tool_calls=[chat_completion_tool_one, chat_completion_tool_one],
                )
            ],
        )

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
                    action_calls=None,
                ),
                message=Message(
                    role="assistant",
                    content=[action_call_one, action_call_two],
                    context=None,
                    function_call=None,
                    name=None,
                    action_calls=[action_call_one, action_call_two],
                ),
                error=None,
            ),
        )

        self.assertEqual(len(plan.commands), 2)
        self.assertEqual(plan.commands[0].type, "DO")
        assert isinstance(plan.commands[0], PredictedDoCommand)
        self.assertEqual(plan.commands[0].action, "LightsOn")
        self.assertEqual(plan.commands[0].parameters, {})
        self.assertEqual(plan.commands[1].type, "DO")
        assert isinstance(plan.commands[1], PredictedDoCommand)
        self.assertEqual(plan.commands[1].action, "Pause")
        self.assertEqual(plan.commands[1].parameters, {"time": 10})
