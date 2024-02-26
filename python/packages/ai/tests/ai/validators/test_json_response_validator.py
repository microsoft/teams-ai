"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from typing import cast
from unittest import IsolatedAsyncioTestCase

from botbuilder.core import TurnContext

from teams.ai.models import PromptResponse
from teams.ai.prompts import Message
from teams.ai.tokenizers import GPTTokenizer
from teams.ai.validators import JSONResponseValidator
from teams.state import TurnState


class TestJSONResponseValidator(IsolatedAsyncioTestCase):
    async def test_should_be_invalid_when_no_message(self):
        validator = JSONResponseValidator()
        res = await validator.validate_response(
            context=cast(TurnContext, {}),
            memory=TurnState(),
            tokenizer=GPTTokenizer(),
            response=PromptResponse(),
            remaining_attempts=3,
        )

        self.assertFalse(res.valid)
        self.assertEqual(res.feedback, None)

    async def test_should_be_invalid_when_missing_json(self):
        validator = JSONResponseValidator()
        response = PromptResponse(message=Message(role="assistant", content=""))

        res = await validator.validate_response(
            context=cast(TurnContext, {}),
            memory=TurnState(),
            tokenizer=GPTTokenizer(),
            response=response,
            remaining_attempts=3,
        )

        self.assertFalse(res.valid)
        self.assertEqual(res.feedback, validator.missing_json_feedback)

    async def test_should_be_invalid_when_invalid_json(self):
        validator = JSONResponseValidator()
        response = PromptResponse(message=Message(role="assistant", content="{]"))

        res = await validator.validate_response(
            context=cast(TurnContext, {}),
            memory=TurnState(),
            tokenizer=GPTTokenizer(),
            response=response,
            remaining_attempts=3,
        )

        self.assertFalse(res.valid)
        self.assertEqual(res.feedback, validator.missing_json_feedback)

    async def test_should_be_valid_when_object_in_text(self):
        validator = JSONResponseValidator()
        response = PromptResponse(
            message=Message(
                role="assistant", content='hi this is an object { "hello": "world" } in json!'
            )
        )

        res = await validator.validate_response(
            context=cast(TurnContext, {}),
            memory=TurnState(),
            tokenizer=GPTTokenizer(),
            response=response,
            remaining_attempts=3,
        )

        self.assertTrue(res.valid)
        self.assertEqual(res.value, {"hello": "world"})

    async def test_should_be_valid_when_multiple_object_in_text_and_return_last_object(self):
        validator = JSONResponseValidator()
        response = PromptResponse(
            message=Message(
                role="assistant",
                content="""
            The following are some objects:

            { \"a\": \"b\" }
            { \"c\": \"d\" }
            [{ \"e\": \"f\" }]

            enjoy!
            """,
            )
        )

        res = await validator.validate_response(
            context=cast(TurnContext, {}),
            memory=TurnState(),
            tokenizer=GPTTokenizer(),
            response=response,
            remaining_attempts=3,
        )

        self.assertTrue(res.valid)
        self.assertEqual(res.value, {"e": "f"})

    async def test_should_be_invalid_when_object_doesnt_match_schema(self):
        validator = JSONResponseValidator(
            schema={
                "type": "object",
                "properties": {"name": {"type": "string"}, "age": {"type": "number"}},
                "required": ["name", "age"],
            }
        )

        response = PromptResponse(
            message=Message(
                role="assistant", content='hi this is an object { "hello": "world" } in json!'
            )
        )

        res = await validator.validate_response(
            context=cast(TurnContext, {}),
            memory=TurnState(),
            tokenizer=GPTTokenizer(),
            response=response,
            remaining_attempts=3,
        )

        self.assertFalse(res.valid)
        self.assertEqual(res.feedback, f"{validator.error_feedback}\n'name' is a required property")

    async def test_should_be_valid_when_object_matchs_schema(self):
        validator = JSONResponseValidator(
            schema={
                "type": "object",
                "properties": {"name": {"type": "string"}, "age": {"type": "number"}},
                "required": ["name", "age"],
            }
        )

        response = PromptResponse(
            message=Message(
                role="assistant",
                content='hi this is an object { "name": "test", "age": 10 } in json!',
            )
        )

        res = await validator.validate_response(
            context=cast(TurnContext, {}),
            memory=TurnState(),
            tokenizer=GPTTokenizer(),
            response=response,
            remaining_attempts=3,
        )

        self.assertTrue(res.valid)
        self.assertEqual(res.feedback, None)
        self.assertEqual(res.value, {"name": "test", "age": 10})
