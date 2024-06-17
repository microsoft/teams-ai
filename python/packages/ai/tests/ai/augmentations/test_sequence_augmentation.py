"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from typing import List, cast
from unittest import IsolatedAsyncioTestCase

from botbuilder.core import TurnContext

from teams.ai.augmentations.sequence_augmentation import SequenceAugmentation
from teams.ai.models.chat_completion_action import ChatCompletionAction
from teams.ai.models.prompt_response import PromptResponse
from teams.ai.planners.plan import PredictedDoCommand, PredictedSayCommand
from teams.ai.prompts.message import Message
from teams.ai.prompts.prompt_functions import PromptFunctions
from teams.ai.tokenizers.gpt_tokenizer import GPTTokenizer
from teams.state.turn_state import TurnState


class TestSequenceAugmentation(IsolatedAsyncioTestCase):
    def setUp(self):
        self.test_actions: List[ChatCompletionAction] = [
            ChatCompletionAction(
                name="test1",
                description="test action",
                parameters={
                    "type": "object",
                    "properties": {"foo": {"type": "string"}},
                    "required": ["foo"],
                },
            )
        ]
        self.tokenizer = GPTTokenizer()
        self.sequence_augmentation = SequenceAugmentation(self.test_actions)

    async def test__sequence_aug_create_prompt_section(self):
        state = TurnState()
        section = self.sequence_augmentation.create_prompt_section()
        if section:
            rendered = await section.render_as_messages(
                cast(TurnContext, {}),
                memory=state,
                functions=cast(PromptFunctions, {}),
                tokenizer=self.tokenizer,
                max_tokens=2000,
            )
            self.assertEqual(len(rendered.output), 1)
            self.assertEqual(rendered.output[0].role, "system")
            self.assertNotEqual(
                str(rendered.output[0].content).find(
                    "Use the actions above to create a plan in the following JSON format:"
                ),
                -1,
            )
            self.assertEqual(rendered.too_long, False)

    async def test_validate_badly_formed_plan(self):
        state = TurnState()
        response = await self.sequence_augmentation.validate_response(
            cast(TurnContext, {}),
            state,
            self.tokenizer,
            PromptResponse[str](message=Message(role="assistant", content="")),
            3,
        )
        self.assertEqual(response.valid, False)
        self.assertEqual(
            response.feedback,
            "Return a JSON object that uses the SAY command to say what you're thinking.",
        )

    async def test_validate_empty_action_in_do_command(self):
        state = TurnState()
        response = await self.sequence_augmentation.validate_response(
            cast(TurnContext, {}),
            state,
            self.tokenizer,
            PromptResponse[str](
                message=Message[str](
                    role="assistant",
                    content='{ "type": "plan", '
                    + '"commands": [{ "type": "DO", "action": "", "parameters": {} }]}',
                )
            ),
            3,
        )
        self.assertEqual(response.valid, False)
        self.assertEqual(
            response.feedback,
            'The plan JSON is missing the DO "action" for '
            + "command[0]. Return the name of the action to DO.",
        )

    async def test_validate_invalid_action_in_do_command(self):
        state = TurnState()
        response = await self.sequence_augmentation.validate_response(
            cast(TurnContext, {}),
            state,
            self.tokenizer,
            PromptResponse[str](
                message=Message[str](
                    role="assistant",
                    content='{ "type": "plan", "commands": '
                    + '[{ "type": "DO", "action": "randomAction", "parameters": {}}]}',
                )
            ),
            3,
        )
        self.assertEqual(response.valid, False)
        self.assertEqual(
            response.feedback, 'Unknown action named "randomAction". Specify a valid action name.'
        )

    async def test_validate_empty_response_in_say_command(self):
        state = TurnState()
        response = await self.sequence_augmentation.validate_response(
            cast(TurnContext, {}),
            state,
            self.tokenizer,
            PromptResponse[str](
                message=Message[str](
                    role="assistant",
                    content='{ "type": "plan", ' + '"commands": [{ "type": "SAY"' + "}]}",
                )
            ),
            3,
        )
        self.assertEqual(response.valid, False)
        self.assertEqual(
            response.feedback,
            'The plan JSON is missing the SAY "response" '
            + "for command[0]. Return the response to SAY.",
        )

    async def test_validate_random_command(self):
        state = TurnState()
        response = await self.sequence_augmentation.validate_response(
            cast(TurnContext, {}),
            state,
            self.tokenizer,
            PromptResponse[str](
                message=Message[str](
                    role="assistant", content='{ "type": "plan", "commands": [{ "type": "DOO" }]}'
                )
            ),
            3,
        )
        self.assertEqual(response.valid, False)
        self.assertEqual(
            response.feedback,
            "The JSON returned had errors. Apply these fixes:\n'DOO' is not one of ['DO', 'SAY']",
        )

    async def test_validate_correct_do_and_say_commands(self):
        state = TurnState()
        response = await self.sequence_augmentation.validate_response(
            cast(TurnContext, {}),
            state,
            self.tokenizer,
            PromptResponse[str](
                message=Message[str](
                    role="assistant",
                    content='{"type":"plan","commands":[{"type":"DO",'
                    + '"action":"test1","parameters": { "foo": "bar" }},'
                    + '{"type":"SAY","response": "hello world"}]}',
                )
            ),
            3,
        )
        self.assertEqual(response.feedback, None)
        self.assertEqual(response.valid, True)

    async def test_create_plan_from_response(self):
        state = TurnState()
        # Validate response
        validation = await self.sequence_augmentation.validate_response(
            cast(TurnContext, {}),
            state,
            self.tokenizer,
            PromptResponse[str](
                message=Message[str](
                    role="assistant",
                    content='{"type":"plan","commands":[{"type":"DO",'
                    + '"action":"test1","parameters": { "foo": "bar" }},'
                    + '{"type":"SAY","response": "hello world"}]}',
                )
            ),
            3,
        )

        # Create plan from response
        plan = await self.sequence_augmentation.create_plan_from_response(
            cast(TurnContext, {}),
            state,
            PromptResponse(message=Message(role="assistant", content=validation.value)),
        )
        command0 = cast(PredictedDoCommand, plan.commands[0])
        command1 = cast(PredictedSayCommand, plan.commands[1])

        self.assertEqual(len(plan.commands), 2)
        self.assertEqual(command0.type, "DO")
        self.assertEqual(command0.action, "test1")
        self.assertEqual(command0.parameters, {"foo": "bar"})

        self.assertEqual(command1.type, "SAY")
        assert command1.response is not None
        self.assertEqual(command1.response.role, "assistant")
        self.assertEqual(command1.response.content, "hello world")
