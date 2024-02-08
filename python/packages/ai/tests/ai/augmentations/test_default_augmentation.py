"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from typing import cast
from unittest import IsolatedAsyncioTestCase

from botbuilder.core import TurnContext

from teams.ai.augmentations.default_augmentation import DefaultAugmentation
from teams.ai.models.prompt_response import PromptResponse
from teams.ai.planner.command_type import CommandType
from teams.ai.planner.plan import Plan
from teams.ai.planner.predicted_do_command import PredictedDoCommand
from teams.ai.prompts.message import Message
from teams.ai.tokenizers.gpt_tokenizer import GPTTokenizer
from teams.state import TurnState


class TestDefaultAugmentation(IsolatedAsyncioTestCase):
    def setUp(self):
        self.tokenizer = GPTTokenizer()
        self.default_augmentation = DefaultAugmentation()

    def test_create_prompt_section(self):
        self.assertEqual(self.default_augmentation.create_prompt_section(), None)

    async def test_validate_response(self):
        state = TurnState()
        prompt_response = PromptResponse(
            message=Message(
                role="assistant",
                content=str(
                    Plan(commands=[PredictedDoCommand(action="test", parameters={"foo": "bar"})])
                ),
            )
        )
        validation = await self.default_augmentation.validate_response(
            cast(TurnContext, {}),
            memory=state,
            tokenizer=self.tokenizer,
            response=prompt_response,
            remaining_attempts=0,
        )
        self.assertEqual(validation.valid, True)

    async def test_create_plan_from_response_where_content_exists(self):
        state = TurnState()

        # Validate response
        say_response = PromptResponse(
            message=Message(role="assistant", content='{ "type": "plan", '
                    +'"commands": [{ "type": "SAY", "response": "hello world"}]}')
        )
        validation = await self.default_augmentation.validate_response(
            cast(TurnContext, {}),
            memory=state,
            tokenizer=self.tokenizer,
            response=say_response,
            remaining_attempts=3,
        )
        self.assertEqual(validation.valid, True)

        # Create plan from validated response
        plan = await self.default_augmentation.create_plan_from_response(
            cast(TurnContext, {}),
            memory=state,
            response=PromptResponse[str](
                message=Message(role="assistant", content=validation.value)
            ),
        )
        self.assertEqual(len(plan.commands), 1)
        self.assertEqual(plan.commands[0].type, CommandType.SAY)
        self.assertEqual(plan.commands[0].response, "") # type: ignore[attr-defined]
