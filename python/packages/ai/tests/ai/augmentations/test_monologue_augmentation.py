"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

import json
from typing import cast
from unittest import IsolatedAsyncioTestCase

from botbuilder.core import TurnContext

from teams.ai.augmentations.monologue_augmentation import (
    Action,
    InnerMonologue,
    MonologueAugmentation,
    Thoughts,
)
from teams.ai.models.chat_completion_action import ChatCompletionAction
from teams.ai.models.prompt_response import PromptResponse
from teams.ai.planners import PredictedDoCommand, PredictedSayCommand
from teams.ai.prompts.message import Message
from teams.ai.prompts.prompt_manager import PromptManager
from teams.ai.prompts.prompt_manager_options import PromptManagerOptions
from teams.ai.tokenizers.gpt_tokenizer import GPTTokenizer
from teams.state import TurnState


class TestMonologueAugmentation(IsolatedAsyncioTestCase):
    def setUp(self):
        self.tokenizer = GPTTokenizer()
        self.test_actions = [
            ChatCompletionAction(
                name="test1",
                description="test action",
                parameters={
                    "type": "object",
                    "properties": {
                        "foo": {
                            "type": "string",
                        }
                    },
                    "required": ["foo"],
                },
            )
        ]
        self.functions = PromptManager(
            options=PromptManagerOptions(
                prompts_folder="",
                role="",
                max_conversation_history_tokens=1,
                max_history_messages=10,
                max_input_tokens=-1,
            )
        )
        self.monologue_augmentation = MonologueAugmentation(self.test_actions)

    async def test_create_prompt_section(self):
        state = TurnState()
        section = self.monologue_augmentation.create_prompt_section()
        if section:
            rendered = await section.render_as_messages(
                cast(TurnContext, {}), state, self.functions, self.tokenizer, 20000
            )
            if rendered:
                self.assertEqual(len(rendered.output), 1)
                self.assertEqual(rendered.output[0].role, "system")
                self.assertNotEqual(str(rendered.output[0].content).find("test action"), -1)
                self.assertNotEqual(
                    str(rendered.output[0].content).find(
                        "Return a JSON object with your thoughts and the next action to perform."
                    ),
                    -1,
                )
                self.assertEqual(rendered.too_long, False)

    async def test_valid_monologue(self):
        state = TurnState()
        response = await self.monologue_augmentation.validate_response(
            cast(TurnContext, {}),
            state,
            self.tokenizer,
            PromptResponse(
                message=Message(
                    role="assistant",
                    content='{ "thoughts": { "thought": "test", "reasoning": '
                    + '"test", "plan": "test" }, "action": { "name": "test1", '
                    + '"parameters": { "foo": "bar" }}}}',
                )
            ),
            3,
        )
        self.assertEqual(response.valid, True)
        self.assertEqual(response.feedback, None)
        if response.value:
            self.assertEqual(
                InnerMonologue.to_dict(response.value),
                {
                    "thoughts": {"thought": "test", "reasoning": "test", "plan": "test"},
                    "action": {"name": "test1", "parameters": {"foo": "bar"}},
                },
            )

    async def test_missing_thought_monologue(self):
        state = TurnState()
        monologue = {
            "thoughts": {"reasoning": "test", "plan": "test"},
            "action": {"name": "test", "parameters": {"foo": "bar"}},
        }
        response = await self.monologue_augmentation.validate_response(
            cast(TurnContext, {}),
            state,
            self.tokenizer,
            PromptResponse(message=Message(role="assistant", content=json.dumps(monologue))),
            3,
        )
        self.assertEqual(response.valid, False)

    async def test_invalid_action_monologue(self):
        state = TurnState()
        monologue = {
            "thoughts": {"thought": "test", "reasoning": "test", "plan": "test"},
            "action": {"name": "foo"},
        }
        response = await self.monologue_augmentation.validate_response(
            cast(TurnContext, {}),
            state,
            self.tokenizer,
            PromptResponse(message=Message(role="assistant", content=json.dumps(monologue))),
            3,
        )
        self.assertEqual(response.valid, False)

    async def test_create_plan_with_say_command(self):
        state = TurnState()
        plan = await self.monologue_augmentation.create_plan_from_response(
            cast(TurnContext, {}),
            state,
            PromptResponse[InnerMonologue](
                message=Message(
                    role="assistant",
                    content=InnerMonologue(
                        thoughts=Thoughts(thought="test", reasoning="test", plan="test"),
                        action=Action(name="SAY", parameters={"text": "hello world"}),
                    ),
                )
            ),
        )
        self.assertEqual(len(plan.commands), 1)
        self.assertEqual(plan.commands[0].type, "SAY")
        assert isinstance(plan.commands[0], PredictedSayCommand)
        assert plan.commands[0].response is not None
        self.assertEqual(plan.commands[0].response.role, "assistant")
        self.assertEqual(plan.commands[0].response.content, "hello world")

    async def test_create_plan_with_do_command(self):
        state = TurnState()
        plan = await self.monologue_augmentation.create_plan_from_response(
            cast(TurnContext, {}),
            state,
            PromptResponse[InnerMonologue](
                message=Message(
                    role="assistant",
                    content=InnerMonologue(
                        thoughts=Thoughts(thought="test", reasoning="test", plan="test"),
                        action=Action(name="test", parameters={"foo": "bar"}),
                    ),
                )
            ),
        )
        self.assertEqual(len(plan.commands), 1)
        self.assertEqual(plan.commands[0].type, "DO")
        assert isinstance(plan.commands[0], PredictedDoCommand)
        self.assertEqual(plan.commands[0].action, "test")
        self.assertEqual(plan.commands[0].parameters.get("foo"), "bar")
