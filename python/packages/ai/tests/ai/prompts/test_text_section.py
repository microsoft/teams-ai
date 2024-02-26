"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from typing import cast
from unittest import IsolatedAsyncioTestCase

from botbuilder.core import TurnContext

from teams.ai.prompts import PromptFunctions, TextSection
from teams.ai.tokenizers import GPTTokenizer
from teams.state import TurnState


class TestTextSection(IsolatedAsyncioTestCase):
    def setUp(self):
        self.text_section = TextSection(
            text="test text!",
            role="test role",
            tokens=10,
            required=True,
            separator="\n",
            text_prefix="prefix",
        )

    async def test_init(self):
        self.assertEqual(self.text_section.text, "test text!")
        self.assertEqual(self.text_section.role, "test role")
        self.assertTrue(self.text_section.required)
        self.assertEqual(self.text_section.separator, "\n")
        self.assertEqual(self.text_section.text_prefix, "prefix")
        self.assertEqual(self.text_section.tokens, 10)
        self.assertEqual(self.text_section._length, -1)

    async def test_render_as_messages(self):
        result = await self.text_section.render_as_messages(
            context=cast(TurnContext, {}),
            memory=TurnState(),
            functions=cast(PromptFunctions, {}),
            tokenizer=GPTTokenizer(),
            max_tokens=10,
        )

        self.assertEqual(self.text_section._length, 3)
        self.assertEqual(len(result.output), 1)
        self.assertEqual(result.output[0].role, "test role")
        self.assertEqual(result.output[0].content, "test text!")
        self.assertFalse(result.too_long)
        self.assertEqual(result.length, 3)

    async def test_render_as_messages_truncate(self):
        self.text_section._tokens = 2
        result = await self.text_section.render_as_messages(
            context=cast(TurnContext, {}),
            memory=TurnState(),
            functions=cast(PromptFunctions, {}),
            tokenizer=GPTTokenizer(),
            max_tokens=1,
        )

        self.assertEqual(len(result.output), 1)
        self.assertEqual(result.output[0].role, "test role")
        self.assertEqual(result.output[0].content, "test text")
        self.assertTrue(result.too_long)
        self.assertEqual(result.length, 2)
