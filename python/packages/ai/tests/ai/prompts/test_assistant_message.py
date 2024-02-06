"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from unittest import TestCase

from teams.ai.prompts import AssistantMessage


class TestAssistantMessage(TestCase):
    def test_init_default_values(self):
        assistant_message = AssistantMessage("template")
        self.assertEqual(assistant_message.template, "template")
        self.assertEqual(assistant_message.tokens, -1)
        self.assertEqual(assistant_message.text_prefix, "assistant: ")
        self.assertEqual(assistant_message.role, "assistant")
        self.assertTrue(assistant_message.required)
        self.assertEqual(assistant_message.separator, "\n")

    def test_init_with_optional_params(self):
        assistant_message = AssistantMessage("template", 1, "text_prefix")
        self.assertEqual(assistant_message.template, "template")
        self.assertEqual(assistant_message.tokens, 1)
        self.assertEqual(assistant_message.text_prefix, "text_prefix")
        self.assertEqual(assistant_message.role, "assistant")
        self.assertTrue(assistant_message.required)
        self.assertEqual(assistant_message.separator, "\n")
