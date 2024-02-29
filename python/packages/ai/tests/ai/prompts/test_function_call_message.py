"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from unittest import IsolatedAsyncioTestCase
from unittest.mock import MagicMock

from botbuilder.core import TurnContext

from teams.ai.prompts import FunctionCall, FunctionCallMessage, PromptFunctions
from teams.ai.tokenizers import GPTTokenizer
from teams.state import Memory


class TestFunctionCallMessage(IsolatedAsyncioTestCase):
    def setUp(self) -> None:
        self.function_call = FunctionCall("test", '{"foo":"bar"}')
        self.memory = MagicMock(spec=Memory)
        self.prompt_functions = MagicMock(spec=PromptFunctions)
        self.turn_context = MagicMock(spec=TurnContext)

    def test_init(self):
        function_call_message = FunctionCallMessage(self.function_call)
        self.assertEqual(function_call_message.function_call, self.function_call)
        self.assertEqual(function_call_message.tokens, -1)
        self.assertTrue(function_call_message.required)
        self.assertEqual(function_call_message.separator, "\n")
        self.assertEqual(function_call_message.text_prefix, "assistant: ")

    def test_init_with_optional_params(self):
        function_call_message = FunctionCallMessage(self.function_call, 100, "text_prefix")
        self.assertEqual(function_call_message.function_call, self.function_call)
        self.assertEqual(function_call_message.tokens, 100)
        self.assertTrue(function_call_message.required)
        self.assertEqual(function_call_message.separator, "\n")
        self.assertEqual(function_call_message.text_prefix, "text_prefix")

    async def test_render_as_messages(self):
        function_call_message = FunctionCallMessage(self.function_call)
        rendered = await function_call_message.render_as_messages(
            self.turn_context, self.memory, self.prompt_functions, GPTTokenizer(), 100
        )
        self.assertEqual(rendered.output[0].role, "assistant")
        self.assertIsNone(rendered.output[0].content)
        self.assertEqual(rendered.output[0].function_call, self.function_call)
        self.assertEqual(rendered.length, 16)
        self.assertFalse(rendered.too_long)
