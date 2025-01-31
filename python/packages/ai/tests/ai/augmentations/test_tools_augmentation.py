"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from typing import cast
from unittest import IsolatedAsyncioTestCase

from botbuilder.core import TurnContext

from teams.ai.augmentations.tools_augmentation import ToolsAugmentation
from teams.ai.models.prompt_response import PromptResponse
from teams.ai.planners.plan import PredictedDoCommand
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
action_call_two = ActionCall(
    id="2",
    function=ActionFunction(arguments='{"time": 10}', name="Pause"),
    type="function",
)


class TestToolsAugmentation(IsolatedAsyncioTestCase):
    def setUp(self):
        self.tokenizer = GPTTokenizer()

    def test_create_prompt_section(self):
        tools_augmentation = ToolsAugmentation()
        self.assertEqual(tools_augmentation.create_prompt_section(), None)

    async def test_validate_response(self):
        state = TurnState()
        prompt_response = PromptResponse[str](
            status="success",
            input=Message(
                role="user",
                content="Why is the sky blue?",
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

    async def test_create_plan_from_response_missing_response_message(self):
        state = TurnState()
        tools_augmentation = ToolsAugmentation()
        plan = await tools_augmentation.create_plan_from_response(
            cast(TurnContext, {}),
            memory=state,
            response=PromptResponse(
                status="success",
                input=Message(
                    role="user",
                    content="hi, can you turn on the lights",
                    context=None,
                    function_call=None,
                    name=None,
                    action_calls=None,
                ),
                message=None,
            ),
        )

        self.assertEqual(len(plan.commands), 1)
        self.assertEqual(plan.commands[0].type, "SAY")

    async def test_create_plan_from_response_missing_action_calls(self):
        state = TurnState()
        tools_augmentation = ToolsAugmentation()
        plan = await tools_augmentation.create_plan_from_response(
            cast(TurnContext, {}),
            memory=state,
            response=PromptResponse(
                status="success",
                input=Message(
                    role="user",
                    content="hi, can you turn on the lights",
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
                    action_calls=None,
                ),
                error=None,
            ),
        )

        self.assertEqual(len(plan.commands), 1)
        self.assertEqual(plan.commands[0].type, "SAY")

    async def test_create_plan_from_response_with_tool(self):
        state = TurnState()
        tools_augmentation = ToolsAugmentation()
        plan = await tools_augmentation.create_plan_from_response(
            cast(TurnContext, {}),
            memory=state,
            response=PromptResponse(
                status="success",
                input=Message(
                    role="user",
                    content="hi, can you turn on the lights",
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
            ),
        )

        self.assertEqual(len(plan.commands), 1)
        assert isinstance(plan.commands[0], PredictedDoCommand)
        self.assertEqual(plan.commands[0].action_id, "1")
        self.assertEqual(plan.commands[0].action, "LightsOn")
        self.assertEqual(plan.commands[0].parameters, {})

    async def test_create_plan_from_response_with_multiple_tools(self):
        state = TurnState()
        tools_augmentation = ToolsAugmentation()
        plan = await tools_augmentation.create_plan_from_response(
            cast(TurnContext, {}),
            memory=state,
            response=PromptResponse(
                status="success",
                input=Message(
                    role="user",
                    content="hi, can you turn on the lights",
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
            ),
        )

        self.assertEqual(len(plan.commands), 2)
        assert isinstance(plan.commands[0], PredictedDoCommand)
        self.assertEqual(plan.commands[0].action_id, "1")
        self.assertEqual(plan.commands[0].action, "LightsOn")
        self.assertEqual(plan.commands[0].parameters, {})
        assert isinstance(plan.commands[1], PredictedDoCommand)
        self.assertEqual(plan.commands[1].action_id, "2")
        self.assertEqual(plan.commands[1].action, "Pause")
        self.assertEqual(plan.commands[1].parameters, {"time": 10})
