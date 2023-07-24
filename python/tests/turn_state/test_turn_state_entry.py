"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

import pytest

from teams_ai.turn_state import TurnStateEntry


class TestTurnStateEntry:

    def test_changed(self):
        entry = TurnStateEntry()
        assert entry.changed is False

        entry.value = {"hello": "world"}
        assert entry.changed is True

    def test_deleted(self):
        entry = TurnStateEntry()
        assert entry.deleted is False

        entry.delete()
        assert entry.deleted is True

    def test_storage_key(self):
        entry = TurnStateEntry(value={"hello": "world"},
                               storage_key="testing123")
        assert entry.storage_key is "testing123"

    def test_value(self):
        entry = TurnStateEntry(value={"hello": "world"})
        assert entry.deleted is False

        entry.delete()
        assert entry.deleted is True
        assert entry.value is not None
        assert entry.deleted is False
