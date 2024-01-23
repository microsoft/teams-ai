"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from unittest import IsolatedAsyncioTestCase

import pytest

from teams.ai.data_sources import TextDataSource
from teams.ai.tokenizers import Tokenizer, GPTTokenizer


class TestTextDataSource(IsolatedAsyncioTestCase):
    tokenizer: Tokenizer

    @pytest.fixture(autouse=True)
    def before_each(self):
        self.tokenizer = GPTTokenizer()
        yield

    def setUp(self):
        self.text_data_source = TextDataSource("testname", "Hello World!")

    async def test_render_data_returns_trimmed_text(self):
        section = await self.text_data_source.render_data({}, {}, self.tokenizer, 1)
        self.assertEqual(section.output, "Hello")
        self.assertEqual(section.too_long, True)
        self.assertEqual(section.length, 1)

    async def test_render_data_returns_full_text(self):
        section = await self.text_data_source.render_data({}, {}, self.tokenizer, 100)
        self.assertEqual(section.output, "Hello World!")
        self.assertEqual(section.too_long, False)
        self.assertEqual(section.length, 3)
