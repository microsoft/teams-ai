"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from unittest import IsolatedAsyncioTestCase
from unittest.mock import MagicMock

from botbuilder.core import TurnContext

from teams.ai.data_sources import TextDataSource
from teams.ai.prompts import DataSourceSection, PromptFunctions
from teams.ai.tokenizers import GPTTokenizer
from teams.state import Memory


class TestDataSourceSection(IsolatedAsyncioTestCase):
    def setUp(self) -> None:
        self.data_source = TextDataSource("test_name", "Hello World!")
        self.memory = MagicMock(spec=Memory)
        self.prompt_functions = MagicMock(spec=PromptFunctions)
        self.turn_context = MagicMock(spec=TurnContext)

    def test_init(self):
        data_source_section = DataSourceSection(self.data_source, -1)
        self.assertEqual(data_source_section.tokens, -1)
        self.assertTrue(data_source_section.required)
        self.assertEqual(data_source_section.separator, "\n\n")
        self.assertEqual(data_source_section.text_prefix, "")

    async def test_render_as_messages(self):
        data_source_section = DataSourceSection(self.data_source, -1)
        rendered = await data_source_section.render_as_messages(
            self.turn_context, self.memory, self.prompt_functions, GPTTokenizer(), 10
        )
        self.assertEqual(rendered.output[0].role, "system")
        self.assertEqual(rendered.output[0].content, "Hello World!")
        self.assertEqual(rendered.length, 3)
        self.assertFalse(rendered.too_long)
