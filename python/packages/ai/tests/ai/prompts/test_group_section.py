"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from unittest import IsolatedAsyncioTestCase
from unittest.mock import MagicMock

from botbuilder.core import TurnContext

from teams.ai.prompts import GroupSection, PromptFunctions, TextSection
from teams.ai.tokenizers import GPTTokenizer
from teams.state import Memory


class TestGroupSection(IsolatedAsyncioTestCase):
    def setUp(self) -> None:
        self.memory = MagicMock(spec=Memory)
        self.prompt_functions = MagicMock(spec=PromptFunctions)
        self.turn_context = MagicMock(spec=TurnContext)

    def test_init(self):
        group_section = GroupSection([TextSection("foo", "user"), TextSection("bar", "user")])
        self.assertEqual(len(group_section.sections), 2)
        self.assertEqual(group_section.role, "system")
        self.assertEqual(group_section.tokens, -1)
        self.assertTrue(group_section.required)
        self.assertEqual(group_section.separator, "\n\n")
        self.assertEqual(group_section.text_prefix, "")

    def test_init_with_optional_params(self):
        group_section = GroupSection(
            [TextSection("foo", "user"), TextSection("bar", "user")],
            "role",
            100,
            False,
            "separator",
            "text_prefix",
        )
        self.assertEqual(len(group_section.sections), 2)
        self.assertEqual(group_section.role, "role")
        self.assertEqual(group_section.tokens, 100)
        self.assertFalse(group_section.required)
        self.assertEqual(group_section.separator, "separator")
        self.assertEqual(group_section.text_prefix, "text_prefix")

    async def test_render_as_messages(self):
        group_section = GroupSection([TextSection("foo", "user"), TextSection("bar", "user")])
        rendered = await group_section.render_as_messages(
            self.turn_context, self.memory, self.prompt_functions, GPTTokenizer(), 100
        )
        self.assertEqual(len(rendered.output), 1)
        self.assertEqual(rendered.output[0].role, "system")
        self.assertEqual(rendered.output[0].content, "foo\n\nbar")
        self.assertEqual(rendered.length, 3)
        self.assertFalse(rendered.too_long)

    async def test_render_as_messages_too_long(self):
        group_section = GroupSection([TextSection("foo", "user"), TextSection("bar", "user")])
        rendered = await group_section.render_as_messages(
            self.turn_context, self.memory, self.prompt_functions, GPTTokenizer(), 1
        )
        self.assertEqual(len(rendered.output), 1)
        self.assertEqual(rendered.output[0].role, "system")
        self.assertEqual(rendered.output[0].content, "foo\n\nbar")
        self.assertEqual(rendered.length, 3)
        self.assertTrue(rendered.too_long)
