"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from typing import cast
from unittest import IsolatedAsyncioTestCase

from botbuilder.core import TurnContext

from teams.ai.models import ChatCompletionAction, PromptResponse
from teams.ai.prompts import FunctionCall, Message
from teams.ai.tokenizers import GPTTokenizer
from teams.ai.validators import ActionResponseValidator, ValidatedChatCompletionAction
from teams.state import TurnState


class TestActionResponseValidator(IsolatedAsyncioTestCase):
    async def test_should_be_valid_when_no_message(self):
        validator = ActionResponseValidator(actions=[])
        res = await validator.validate_response(
            context=cast(TurnContext, {}),
            memory=TurnState(),
            tokenizer=GPTTokenizer(),
            response=PromptResponse(),
            remaining_attempts=3,
        )

        self.assertTrue(res.valid)

    async def test_should_be_invalid_when_no_message_but_is_required(self):
        validator = ActionResponseValidator(actions=[], required=True)
        res = await validator.validate_response(
            context=cast(TurnContext, {}),
            memory=TurnState(),
            tokenizer=GPTTokenizer(),
            response=PromptResponse(),
            remaining_attempts=3,
        )

        self.assertFalse(res.valid)
        self.assertEqual(
            res.feedback, "No action was specified. Call a action with valid arguments."
        )

    async def test_should_be_valid_when_no_function(self):
        validator = ActionResponseValidator(actions=[])
        res = await validator.validate_response(
            context=cast(TurnContext, {}),
            memory=TurnState(),
            tokenizer=GPTTokenizer(),
            response=PromptResponse(message=Message(role="assistant")),
            remaining_attempts=3,
        )

        self.assertTrue(res.valid)

    async def test_should_be_invalid_when_no_function_but_is_required(self):
        validator = ActionResponseValidator(actions=[], required=True)
        res = await validator.validate_response(
            context=cast(TurnContext, {}),
            memory=TurnState(),
            tokenizer=GPTTokenizer(),
            response=PromptResponse(message=Message(role="assistant")),
            remaining_attempts=3,
        )

        self.assertFalse(res.valid)
        self.assertEqual(
            res.feedback, "No action was specified. Call a action with valid arguments."
        )

    async def test_should_be_invalid_when_no_function_name(self):
        validator = ActionResponseValidator(actions=[], required=True)
        message = Message(role="assistant", function_call=FunctionCall(name=None, arguments=None))

        res = await validator.validate_response(
            context=cast(TurnContext, {}),
            memory=TurnState(),
            tokenizer=GPTTokenizer(),
            response=PromptResponse(message=message),
            remaining_attempts=3,
        )

        self.assertFalse(res.valid)
        self.assertEqual(res.feedback, "action name missing. Specify a valid action name.")

    async def test_should_be_invalid_when_action_not_found(self):
        validator = ActionResponseValidator(actions=[ChatCompletionAction(name="a")], required=True)

        message = Message(role="assistant", function_call=FunctionCall(name="test", arguments=None))

        res = await validator.validate_response(
            context=cast(TurnContext, {}),
            memory=TurnState(),
            tokenizer=GPTTokenizer(),
            response=PromptResponse(message=message),
            remaining_attempts=3,
        )

        self.assertFalse(res.valid)
        self.assertEqual(res.feedback, 'Unknown action named "test". Specify a valid action name.')

    async def test_should_be_invalid_when_action_params_invalid(self):
        validator = ActionResponseValidator(
            actions=[
                ChatCompletionAction(
                    name="test",
                    parameters={
                        "type": "object",
                        "properties": {"name": {"type": "string"}, "age": {"type": "number"}},
                        "required": ["name", "age"],
                    },
                )
            ],
            required=True,
        )

        message = Message(
            role="assistant",
            function_call=FunctionCall(name="test", arguments='{ "name": "test", "age": "10" }'),
        )

        res = await validator.validate_response(
            context=cast(TurnContext, {}),
            memory=TurnState(),
            tokenizer=GPTTokenizer(),
            response=PromptResponse(message=message),
            remaining_attempts=3,
        )

        self.assertFalse(res.valid)
        self.assertEqual(
            res.feedback,
            'The action arguments had errors. Apply these fixes and call "test" '
            "action again:\n'10' is not of type 'number'",
        )

    async def test_should_be_valid(self):
        validator = ActionResponseValidator(
            actions=[
                ChatCompletionAction(
                    name="test",
                    parameters={
                        "type": "object",
                        "properties": {"name": {"type": "string"}, "age": {"type": "number"}},
                        "required": ["name", "age"],
                    },
                )
            ],
            required=True,
        )

        message = Message(
            role="assistant",
            function_call=FunctionCall(name="test", arguments='{ "name": "test", "age": 10 }'),
        )

        res = await validator.validate_response(
            context=cast(TurnContext, {}),
            memory=TurnState(),
            tokenizer=GPTTokenizer(),
            response=PromptResponse(message=message),
            remaining_attempts=3,
        )

        self.assertTrue(res.valid)
        self.assertEqual(res.feedback, None)
        self.assertEqual(
            res.value,
            ValidatedChatCompletionAction(name="test", parameters={"name": "test", "age": 10}),
        )
