"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from typing import cast
from unittest import IsolatedAsyncioTestCase

import pytest
from botbuilder.core import TurnContext

from teams.ai.data_sources import TextDataSource
from teams.ai.tokenizers import GPTTokenizer, Tokenizer
from teams.state import TurnState


class TestTextDataSource(IsolatedAsyncioTestCase):
    tokenizer: Tokenizer

    @pytest.fixture(autouse=True)
    def before_each(self):
        self.tokenizer = GPTTokenizer()
        yield

    def setUp(self):
        self.text_data_source = TextDataSource("testname", "Hello World!")

    async def test_render_data_returns_trimmed_text(self):
        state = TurnState()
        section = await self.text_data_source.render_data(
            turn_context=cast(TurnContext, {}), memory=state, tokenizer=self.tokenizer, max_tokens=1
        )

        self.assertEqual(section.output, "Hello")
        self.assertEqual(section.too_long, True)
        self.assertEqual(section.length, 1)

    async def test_render_data_returns_full_text(self):
        state = TurnState()
        section = await self.text_data_source.render_data(
            turn_context=cast(TurnContext, {}),
            memory=state,
            tokenizer=self.tokenizer,
            max_tokens=100,
        )

        self.assertEqual(section.output, "Hello World!")
        self.assertEqual(section.too_long, False)
        self.assertEqual(section.length, 3)
