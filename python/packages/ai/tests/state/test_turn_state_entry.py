"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from typing import TypedDict
from unittest import TestCase

from teams.ai.state import TurnStateEntry


class CustomState(TypedDict):
    hello: str


class TestTurnStateEntry(TestCase):
    def test_changed(self):
        entry = TurnStateEntry[CustomState]({"hello": "world"})
        self.assertFalse(entry.has_changed)

        entry.value["hello"] = "hello"
        self.assertTrue(entry.has_changed)

    def test_deleted(self):
        entry = TurnStateEntry[CustomState]({"hello": "world"})
        self.assertFalse(entry.is_deleted)

        entry.delete()
        self.assertTrue(entry.is_deleted)

    def test_storage_key(self):
        entry = TurnStateEntry[CustomState](value={"hello": "world"}, storage_key="testing123")
        self.assertEqual(entry.storage_key, "testing123")

    def test_value(self):
        entry = TurnStateEntry[CustomState](value={"hello": "world"})
        self.assertFalse(entry.is_deleted)

        entry.delete()
        self.assertTrue(entry.is_deleted)
        entry.replace({"hello": "hello"})
        self.assertFalse(entry.is_deleted)
