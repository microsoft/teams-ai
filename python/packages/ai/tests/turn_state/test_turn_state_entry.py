"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from unittest import TestCase

from teams.ai.turn_state import TurnStateEntry


class TestTurnStateEntry(TestCase):
    def test_changed(self):
        entry = TurnStateEntry({"hello": "world"})
        self.assertFalse(entry.has_changed)

        entry.value["hello"] = "hello"
        self.assertTrue(entry.has_changed)

    def test_deleted(self):
        entry = TurnStateEntry()
        self.assertFalse(entry.is_deleted)

        entry.delete()
        self.assertTrue(entry.is_deleted)

    def test_storage_key(self):
        entry = TurnStateEntry(value={"hello": "world"}, storage_key="testing123")
        self.assertEqual(entry.storage_key, "testing123")

    def test_value(self):
        entry = TurnStateEntry(value={"hello": "world"})
        self.assertFalse(entry.is_deleted)

        entry.delete()
        self.assertTrue(entry.is_deleted)
        entry.replace({"another": "hello"})
        self.assertFalse(entry.is_deleted)
