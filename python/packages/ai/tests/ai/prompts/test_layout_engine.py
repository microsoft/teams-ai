"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from typing import cast
from unittest import IsolatedAsyncioTestCase

from botbuilder.core import TurnContext

from teams.ai.prompts import LayoutEngineSection, PromptFunctions, TextSection
from teams.ai.tokenizers import GPTTokenizer
from teams.state import TurnState


class TestLayoutEngine(IsolatedAsyncioTestCase):
    async def test_render_as_text_empty_sections(self):
        layout_engine = LayoutEngineSection([], 1, False, "\n")
        result = await layout_engine.render_as_text(
            context=cast(TurnContext, {}),
            memory=TurnState(),
            functions=cast(PromptFunctions, {}),
            tokenizer=GPTTokenizer(),
            max_tokens=1,
        )

        self.assertEqual(result.output, "")
        self.assertEqual(result.length, 0)
        self.assertFalse(result.too_long)

    async def test_render_as_text_fixed_sections(self):
        section1 = TextSection("Hello World!", "user")
        section2 = TextSection("Teams-AI", "user")
        layout_engine = LayoutEngineSection([section1, section2], 1, False, " ")
        result = await layout_engine.render_as_text(
            context=cast(TurnContext, {}),
            memory=TurnState(),
            functions=cast(PromptFunctions, {}),
            tokenizer=GPTTokenizer(),
            max_tokens=100,
        )

        self.assertEqual(result.output, "Hello World! Teams-AI")
        self.assertEqual(result.length, 6)
        self.assertFalse(result.too_long)

    async def test_render_as_text_fixed_sections_too_long(self):
        section1 = TextSection("Hello World!", "user")
        section2 = TextSection("Teams-AI", "user")
        layout_engine = LayoutEngineSection([section1, section2], 1, False, " ")
        result = await layout_engine.render_as_text(
            context=cast(TurnContext, {}),
            memory=TurnState(),
            functions=cast(PromptFunctions, {}),
            tokenizer=GPTTokenizer(),
            max_tokens=5,
        )

        self.assertEqual(result.output, "Hello World! Teams-AI")
        self.assertEqual(result.length, 6)
        self.assertTrue(result.too_long)

    async def test_render_as_text_fixed_sections_drop_optional(self):
        section1 = TextSection("Hello World!", "user")
        section2 = TextSection("Teams-AI", "user", required=False)
        layout_engine = LayoutEngineSection([section1, section2], 1, False, " ")
        result = await layout_engine.render_as_text(
            context=cast(TurnContext, {}),
            memory=TurnState(),
            functions=cast(PromptFunctions, {}),
            tokenizer=GPTTokenizer(),
            max_tokens=5,
        )

        self.assertEqual(result.output, "Hello World!")
        self.assertEqual(result.length, 3)
        self.assertFalse(result.too_long)

    async def test_render_as_text_fixed_sections_too_long_after_drop(self):
        section1 = TextSection("Hello World!", "user")
        section2 = TextSection("Teams-AI", "user", required=False)
        layout_engine = LayoutEngineSection([section1, section2], 1, False, " ")
        result = await layout_engine.render_as_text(
            context=cast(TurnContext, {}),
            memory=TurnState(),
            functions=cast(PromptFunctions, {}),
            tokenizer=GPTTokenizer(),
            max_tokens=2,
        )

        self.assertEqual(result.output, "Hello World!")
        self.assertEqual(result.length, 3)
        self.assertTrue(result.too_long)

    async def test_render_as_text_proportional_sections(self):
        section1 = TextSection("Hello World!", "user", tokens=0.5)
        section2 = TextSection("Teams-AI", "user", tokens=0.5)
        layout_engine = LayoutEngineSection([section1, section2], 1, False, " ")
        result = await layout_engine.render_as_text(
            context=cast(TurnContext, {}),
            memory=TurnState(),
            functions=cast(PromptFunctions, {}),
            tokenizer=GPTTokenizer(),
            max_tokens=5,
        )

        self.assertEqual(result.output, "Hello World! Teams-AI")
        self.assertEqual(result.length, 6)
        self.assertTrue(result.too_long)

    async def test_render_as_text_proportional_sections_drop_optional(self):
        section2 = TextSection("Teams-AI!", "user", tokens=0.5, required=False)
        section1 = TextSection("Hello World!", "user", tokens=0.5, required=False)
        layout_engine = LayoutEngineSection([section1, section2], 1, False, " ")
        result = await layout_engine.render_as_text(
            context=cast(TurnContext, {}),
            memory=TurnState(),
            functions=cast(PromptFunctions, {}),
            tokenizer=GPTTokenizer(),
            max_tokens=6,
        )

        self.assertEqual(
            result.output, "Hello World!"
        )  # Teams-AI! should be dropped as Hello World! gets enough token capacity
        self.assertEqual(result.length, 3)
        self.assertFalse(result.too_long)

    async def test_render_as_text_proportional_sections_too_long_after_drop(self):
        section1 = TextSection("Hello World!", "user", tokens=0.5)
        section2 = TextSection("Teams-AI!", "user", tokens=0.5, required=False)
        layout_engine = LayoutEngineSection([section1, section2], 1, False, " ")
        result = await layout_engine.render_as_text(
            context=cast(TurnContext, {}),
            memory=TurnState(),
            functions=cast(PromptFunctions, {}),
            tokenizer=GPTTokenizer(),
            max_tokens=2,
        )

        self.assertEqual(result.output, "Hello World!")
        self.assertEqual(result.length, 3)
        self.assertTrue(result.too_long)

    async def test_render_as_messages_empty_sections(self):
        layout_engine = LayoutEngineSection([], 1, False, "\n")
        result = await layout_engine.render_as_messages(
            context=cast(TurnContext, {}),
            memory=TurnState(),
            functions=cast(PromptFunctions, {}),
            tokenizer=GPTTokenizer(),
            max_tokens=1,
        )

        self.assertEqual(result.output, [])
        self.assertEqual(result.length, 0)
        self.assertFalse(result.too_long)

    async def test_render_as_messages(self):
        section1 = TextSection("Hello World!", "user")
        section2 = TextSection("Teams-AI", "user")
        layout_engine = LayoutEngineSection([section1, section2], 1, False, " ")
        result = await layout_engine.render_as_messages(
            context=cast(TurnContext, {}),
            memory=TurnState(),
            functions=cast(PromptFunctions, {}),
            tokenizer=GPTTokenizer(),
            max_tokens=100,
        )

        self.assertEqual(result.output[0].content, "Hello World!")
        self.assertEqual(result.output[1].content, "Teams-AI")
        self.assertEqual(result.length, 6)
        self.assertFalse(result.too_long)
