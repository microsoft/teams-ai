"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

import base64
from unittest import IsolatedAsyncioTestCase
from unittest.mock import MagicMock

from botbuilder.core import TurnContext

from teams import InputFile
from teams.ai.prompts import (
    ImageContentPart,
    ImageUrl,
    PromptFunctions,
    TextContentPart,
    UserInputMessage,
)
from teams.ai.tokenizers import GPTTokenizer
from teams.state import ConversationState, TempState, TurnState, UserState


class TestUserInputMessage(IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        self.context = MagicMock(spec=TurnContext)
        self.memory = await TurnState[ConversationState, UserState, TempState].load(self.context)
        self.functions = MagicMock(spec=PromptFunctions)
        self.tokenizer = GPTTokenizer()
        await self.memory.load(self.context)

    def test_init_default(self):
        message = UserInputMessage()
        self.assertEqual(message.tokens, -1)
        self.assertEqual(message._input_variable, "input")
        self.assertEqual(message._files_variable, "input_files")

    def test_init_with_optional_params(self):
        message = UserInputMessage(input_variable="customInput", files_variable="customFiles")
        self.assertEqual(message._input_variable, "customInput")
        self.assertEqual(message._files_variable, "customFiles")

    async def test_render_as_messages_no_input(self):
        message = UserInputMessage()
        del self.memory.temp
        result = await message.render_as_messages(
            self.context, self.memory, self.functions, self.tokenizer, 100
        )
        self.assertEqual(result.length, 0)
        self.assertEqual(len(result.output), 1)
        self.assertEqual(result.output[0].content, [])
        self.assertEqual(result.output[0].role, "user")
        self.assertFalse(result.too_long)

    async def test_render_as_messages_with_text(self):
        message = UserInputMessage()
        self.memory.temp.input = "Hello, world!"
        result = await message.render_as_messages(
            self.context, self.memory, self.functions, self.tokenizer, 100
        )
        self.assertEqual(result.length, 4)
        self.assertEqual(len(result.output), 1)
        assert result.output[0].content is not None
        self.assertEqual(len(result.output[0].content), 1)
        self.assertTrue(isinstance(result.output[0].content[0], TextContentPart))
        self.assertEqual(result.output[0].content[0].text, "Hello, world!")
        self.assertEqual(result.output[0].role, "user")
        self.assertFalse(result.too_long)

    async def test_render_as_messages_with_text_truncated(self):
        message = UserInputMessage()
        self.memory.temp.input = "Hello, world!"
        result = await message.render_as_messages(
            self.context, self.memory, self.functions, self.tokenizer, 2
        )
        self.assertEqual(result.length, 2)
        self.assertEqual(len(result.output), 1)
        assert result.output[0].content is not None
        self.assertEqual(len(result.output[0].content), 1)
        self.assertTrue(isinstance(result.output[0].content[0], TextContentPart))
        self.assertEqual(result.output[0].content[0].text, "Hello,")
        self.assertEqual(result.output[0].role, "user")
        self.assertFalse(result.too_long)

    async def test_render_as_messages_with_files(self):
        message = UserInputMessage()
        base64_string = "SGVsbG8gd29ybGQ="  # Mock the expected content
        self.memory.temp.input_files = [
            InputFile(base64.b64decode(base64_string), "image/png", None)
        ]
        result = await message.render_as_messages(
            self.context, self.memory, self.functions, self.tokenizer, 100
        )
        self.assertEqual(result.length, 85)
        self.assertEqual(len(result.output), 1)
        assert result.output[0].content is not None
        self.assertEqual(len(result.output[0].content), 1)
        self.assertIsInstance(result.output[0].content[0], ImageContentPart)
        self.assertIsInstance(result.output[0].content[0].image_url, ImageUrl)
        self.assertEqual(
            result.output[0].content[0].image_url.url, f"data:image/png;base64,{base64_string}"
        )
        self.assertEqual(result.output[0].role, "user")
        self.assertFalse(result.too_long)

    async def test_render_as_messages_with_files_truncated(self):
        message = UserInputMessage()
        base64_string = "SGVsbG8gd29ybGQ="  # Mock the expected content
        self.memory.temp.input_files = [
            InputFile(base64.b64decode(base64_string), "image/png", None)
        ]
        result = await message.render_as_messages(
            self.context, self.memory, self.functions, self.tokenizer, 50
        )
        self.assertEqual(result.length, 0)
        self.assertEqual(len(result.output), 1)
        assert result.output[0].content is not None
        self.assertEqual(len(result.output[0].content), 0)
        self.assertEqual(result.output[0].role, "user")
        self.assertFalse(result.too_long)

    async def test_render_as_messages_with_text_and_files(self):
        message = UserInputMessage()
        self.memory.temp.input = "Hello, world!"
        base64_string = "SGVsbG8gd29ybGQ="  # Mock the expected content
        self.memory.temp.input_files = [
            InputFile(base64.b64decode(base64_string), "image/png", None)
        ]
        result = await message.render_as_messages(
            self.context, self.memory, self.functions, self.tokenizer, 100
        )
        self.assertEqual(result.length, 4 + 85)  # Length of text and image
        self.assertEqual(len(result.output), 1)
        assert result.output[0].content is not None
        self.assertEqual(len(result.output[0].content), 2)
        self.assertTrue(isinstance(result.output[0].content[0], TextContentPart))
        self.assertEqual(result.output[0].content[0].text, "Hello, world!")
        self.assertIsInstance(result.output[0].content[1], ImageContentPart)
        self.assertIsInstance(result.output[0].content[1].image_url, ImageUrl)
        self.assertEqual(
            result.output[0].content[1].image_url.url, f"data:image/png;base64,{base64_string}"
        )
        self.assertEqual(result.output[0].role, "user")
        self.assertFalse(result.too_long)

    async def test_render_as_messages_with_text_and_files_truncated(self):
        message = UserInputMessage()
        self.memory.temp.input = "Hello, world!"
        base64_string = "SGVsbG8gd29ybGQ="  # Mock the expected content
        self.memory.temp.input_files = [
            InputFile(base64.b64decode(base64_string), "image/png", None)
        ]
        result = await message.render_as_messages(
            self.context, self.memory, self.functions, self.tokenizer, 85
        )
        self.assertEqual(result.length, 4)
        self.assertEqual(len(result.output), 1)
        assert result.output[0].content is not None
        self.assertEqual(len(result.output[0].content), 1)
        self.assertTrue(isinstance(result.output[0].content[0], TextContentPart))
        self.assertEqual(result.output[0].content[0].text, "Hello, world!")
        self.assertEqual(result.output[0].role, "user")
        self.assertFalse(result.too_long)
