"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

import pytest

from teams.ai.turn_state import TurnStateEntry


class TestTurnStateEntry:

    def test_changed(self):
        entry = TurnStateEntry({"hello": "world"})
        assert entry.has_changed is False

        entry.value["hello"] = "hello"
        assert entry.has_changed is True

    def test_deleted(self):
        entry = TurnStateEntry()
        assert entry.is_deleted is False

        entry.delete()
        assert entry.is_deleted is True

    def test_storage_key(self):
        entry = TurnStateEntry(value={"hello": "world"},
                               storage_key="testing123")
        assert entry.storage_key is "testing123"

    def test_value(self):
        entry = TurnStateEntry(value={"hello": "world"})
        assert entry.is_deleted is False

        entry.delete()
        assert entry.is_deleted is True
        entry.replace({"another": "hello"})
        assert entry.is_deleted is False
