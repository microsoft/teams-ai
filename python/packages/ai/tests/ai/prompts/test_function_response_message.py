"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from unittest import IsolatedAsyncioTestCase
from unittest.mock import MagicMock

from botbuilder.core import TurnContext

from teams.ai.prompts import FunctionResponseMessage, PromptFunctions
from teams.ai.tokenizers import GPTTokenizer
from teams.state import Memory


class TestFunctionResponseMessage(IsolatedAsyncioTestCase):
    def setUp(self) -> None:
        self.memory = MagicMock(spec=Memory)
        self.prompt_functions = MagicMock(spec=PromptFunctions)
        self.turn_context = MagicMock(spec=TurnContext)

    def test_init(self):
        function_response_message = FunctionResponseMessage("foo", "bar")
        self.assertEqual(function_response_message.name, "foo")
        self.assertEqual(function_response_message.response, "bar")
        self.assertEqual(function_response_message.tokens, -1)
        self.assertTrue(function_response_message.required)
        self.assertEqual(function_response_message.separator, "\n")
        self.assertEqual(function_response_message.text_prefix, "user: ")

    def test_init_with_optional_params(self):
        function_response_message = FunctionResponseMessage("foo", "bar", 100, "text_prefix")
        self.assertEqual(function_response_message.name, "foo")
        self.assertEqual(function_response_message.response, "bar")
        self.assertEqual(function_response_message.tokens, 100)
        self.assertTrue(function_response_message.required)
        self.assertEqual(function_response_message.separator, "\n")
        self.assertEqual(function_response_message.text_prefix, "text_prefix")

    async def test_render_as_messages(self):
        function_response_message = FunctionResponseMessage("foo", "bar")
        rendered = await function_response_message.render_as_messages(
            self.turn_context, self.memory, self.prompt_functions, GPTTokenizer(), 100
        )
        self.assertEqual(rendered.output[0].role, "function")
        self.assertEqual(rendered.output[0].content, '"bar"')
        self.assertEqual(rendered.output[0].name, "foo")
        self.assertEqual(rendered.length, 4)
        self.assertFalse(rendered.too_long)
