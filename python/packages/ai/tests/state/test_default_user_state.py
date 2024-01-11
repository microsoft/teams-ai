"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from unittest import TestCase

from teams.state import DefaultUserState

class TestDefaultConversationState(TestCase):
    def setUp(self):
        self.data = {"key1": "value1", "key2": "value2"}
        self.conversation_state = DefaultUserState(self.data)

    def test_get_dict(self):
        self.assertEqual(self.conversation_state.get_dict(), self.data)
