"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from unittest import TestCase

from teams.ai.prompts import SystemMessage


class TestSystemMessage(TestCase):
    def test_init(self):
        system_message = SystemMessage("template")
        self.assertEqual(system_message.template, "template")
        self.assertEqual(system_message.tokens, -1)
        self.assertEqual(system_message.text_prefix, "")
        self.assertEqual(system_message.role, "system")
        self.assertTrue(system_message.required)
        self.assertEqual(system_message.separator, "\n")

    def test_init_with_optional_params(self):
        system_message = SystemMessage("template", 100)
        self.assertEqual(system_message.template, "template")
        self.assertEqual(system_message.tokens, 100)
        self.assertEqual(system_message.text_prefix, "")
        self.assertEqual(system_message.role, "system")
        self.assertTrue(system_message.required)
        self.assertEqual(system_message.separator, "\n")
