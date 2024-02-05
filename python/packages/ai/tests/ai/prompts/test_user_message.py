"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from unittest import TestCase

from teams.ai.prompts import UserMessage


class TestUserMessage(TestCase):
    def test_init(self):
        user_message = UserMessage("template")
        self.assertEqual(user_message.template, "template")
        self.assertEqual(user_message.tokens, -1)
        self.assertEqual(user_message.text_prefix, "user: ")
        self.assertEqual(user_message.role, "user")
        self.assertTrue(user_message.required)
        self.assertEqual(user_message.separator, "\n")

    def test_init_with_optional_params(self):
        user_message = UserMessage("template", 100, "text_prefix")
        self.assertEqual(user_message.template, "template")
        self.assertEqual(user_message.tokens, 100)
        self.assertEqual(user_message.text_prefix, "text_prefix")
        self.assertEqual(user_message.role, "user")
        self.assertTrue(user_message.required)
        self.assertEqual(user_message.separator, "\n")
