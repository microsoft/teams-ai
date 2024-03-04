"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from typing import cast
from unittest import IsolatedAsyncioTestCase
from unittest.mock import AsyncMock

from botbuilder.core import TurnContext

from teams.ai.prompts import (
    FunctionCall,
    ImageContentPart,
    Message,
    PromptFunctions,
    PromptSectionBase,
    RenderedPromptSection,
    TextContentPart,
)
from teams.ai.tokenizers import GPTTokenizer
from teams.state import TurnState


class TestablePromptSectionBase(PromptSectionBase):
    __test__ = False

    def __init__(
        self,
        tokens: float = -1,
        required: bool = True,
        separator: str = "\n",
        text_prefix: str = "",
    ):
        super().__init__(tokens, required, separator, text_prefix)

    async def render_as_messages(self, context, memory, functions, tokenizer, max_tokens):
        return RenderedPromptSection([], 0, False)


class TestPromptSectionBase(IsolatedAsyncioTestCase):
    async def test_render_as_text_empty_message(self):
        section = TestablePromptSectionBase()
        section.render_as_messages = AsyncMock(return_value=RenderedPromptSection([], 0, False))
        result = await section.render_as_text(
            context=cast(TurnContext, {}),
            memory=TurnState(),
            functions=cast(PromptFunctions, {}),
            tokenizer=GPTTokenizer(),
            max_tokens=5,
        )

        self.assertEqual(result.output, "")
        self.assertEqual(result.length, 0)
        self.assertFalse(result.too_long)

    async def test_render_as_text_multiple_messages(self):
        section = TestablePromptSectionBase()
        messages = [Message("User", "Hello World!"), Message("User", "Teams-AI")]
        section.render_as_messages = AsyncMock(
            return_value=RenderedPromptSection(messages, 6, False)
        )
        result = await section.render_as_text(
            context=cast(TurnContext, {}),
            memory=TurnState(),
            functions=cast(PromptFunctions, {}),
            tokenizer=GPTTokenizer(),
            max_tokens=100,
        )

        self.assertEqual(result.output, "Hello World!\nTeams-AI")
        self.assertEqual(result.length, 7)
        self.assertFalse(result.too_long)

    async def test_render_as_text_multiple_messages_too_long(self):
        section = TestablePromptSectionBase()
        messages = [Message("User", "Hello World!"), Message("User", "Teams-AI")]
        section.render_as_messages = AsyncMock(
            return_value=RenderedPromptSection(messages, 6, False)
        )
        result = await section.render_as_text(
            context=cast(TurnContext, {}),
            memory=TurnState(),
            functions=cast(PromptFunctions, {}),
            tokenizer=GPTTokenizer(),
            max_tokens=5,
        )

        self.assertEqual(result.output, "Hello World!\nTeams-AI")
        self.assertEqual(result.length, 7)
        self.assertTrue(result.too_long)

    async def test_render_as_text_multiple_truncate_fixed_length(self):
        section = TestablePromptSectionBase(tokens=5)
        messages = [Message("User", "Hello World!"), Message("User", "Teams-AI")]
        section.render_as_messages = AsyncMock(
            return_value=RenderedPromptSection(messages, 6, False)
        )
        result = await section.render_as_text(
            context=cast(TurnContext, {}),
            memory=TurnState(),
            functions=cast(PromptFunctions, {}),
            tokenizer=GPTTokenizer(),
            max_tokens=5,
        )

        self.assertEqual(result.output, "Hello World!\nTeams-A")
        self.assertEqual(result.length, 5)
        self.assertFalse(result.too_long)

    async def test_get_token_buge_fixed_token(self):
        section = TestablePromptSectionBase(tokens=5)
        result = section._get_token_budget(10)
        self.assertEqual(result, 5)
        result = section._get_token_budget(3)
        self.assertEqual(result, 3)

    async def test_get_token_buge_proportional_token(self):
        section = TestablePromptSectionBase(tokens=0.5)
        result = section._get_token_budget(10)
        self.assertEqual(result, 10)

    async def test_return_messages_fixed_sections(self):
        section = TestablePromptSectionBase()
        messages = [Message("User", "Hello World!"), Message("User", "Teams-AI")]
        result = section._return_messages(messages, 6, GPTTokenizer(), 100)
        self.assertEqual(result.output, messages)
        self.assertEqual(result.length, 6)
        self.assertFalse(result.too_long)

    async def test_return_messages_fixed_sections_too_long(self):
        section = TestablePromptSectionBase(tokens=5)
        messages = [Message("User", "Hello World!"), Message("User", "Teams-AI")]
        result = section._return_messages(messages, 6, GPTTokenizer(), 4)
        self.assertEqual(result.output[0].content, "Hello World!")
        self.assertEqual(result.output[1].content, "Teams-A")
        self.assertEqual(result.length, 5)
        self.assertTrue(result.too_long)

    async def test_return_messages_proportional_sections(self):
        section = TestablePromptSectionBase(tokens=0.5)
        messages = [Message("User", "Hello World!"), Message("User", "Teams-AI")]
        result = section._return_messages(messages, 6, GPTTokenizer(), 4)
        self.assertEqual(result.output[0].content, "Hello World!")
        self.assertEqual(result.output[1].content, "Teams-AI")
        self.assertEqual(result.length, 6)
        self.assertTrue(result.too_long)

    async def test_get_message_text(self):
        result = PromptSectionBase.get_message_text(Message("User", "Hello World!"))
        self.assertEqual(result, "Hello World!")

    async def test_get_message_text_with_name(self):
        result = PromptSectionBase.get_message_text(
            Message("User", "Hello World!", name="TestCase")
        )
        self.assertEqual(result, "TestCase returned Hello World!")

    async def test_get_message_text_content_part_list(self):
        result = PromptSectionBase.get_message_text(
            Message(
                "User",
                [
                    TextContentPart("text", "Hello"),
                    TextContentPart("text", "World!"),
                    ImageContentPart("image_url", "https://www.microsoft.com"),
                ],
            )
        )
        self.assertEqual(result, "Hello World!")

    async def test_get_message_text_function_call(self):
        result = PromptSectionBase.get_message_text(
            Message("User", function_call=FunctionCall("function name", "arguments"))
        )
        self.assertEqual(result, '{"name": "function name", "arguments": "arguments"}')

    def test_required_property(self):
        prompt_section_base = TestablePromptSectionBase(
            tokens=0.5, required=True, separator=";", text_prefix="prefix"
        )
        self.assertEqual(prompt_section_base.required, True)

    def test_tokens_property(self):
        prompt_section_base = TestablePromptSectionBase(
            tokens=0.5, required=True, separator=";", text_prefix="prefix"
        )
        self.assertEqual(prompt_section_base.tokens, 0.5)

    def test_separator_property(self):
        prompt_section_base = TestablePromptSectionBase(
            tokens=0.5, required=True, separator=";", text_prefix="prefix"
        )
        self.assertEqual(prompt_section_base.separator, ";")

    def test_text_prefix_property(self):
        prompt_section_base = TestablePromptSectionBase(
            tokens=0.5, required=True, separator=";", text_prefix="prefix"
        )
        self.assertEqual(prompt_section_base.text_prefix, "prefix")

    def test_required_property_default(self):
        prompt_section_base = TestablePromptSectionBase()
        self.assertEqual(prompt_section_base.required, True)

    def test_tokens_property_default(self):
        prompt_section_base = TestablePromptSectionBase()
        self.assertEqual(prompt_section_base.tokens, -1)

    def test_separator_property_default(self):
        prompt_section_base = TestablePromptSectionBase()
        self.assertEqual(prompt_section_base.separator, "\n")

    def test_text_prefix_property_default(self):
        prompt_section_base = TestablePromptSectionBase()
        self.assertEqual(prompt_section_base.text_prefix, "")
