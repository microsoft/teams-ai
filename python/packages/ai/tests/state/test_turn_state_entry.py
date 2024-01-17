"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""
from copy import deepcopy
from unittest import TestCase

from teams.state import TurnStateEntry


class TestTurnStateEntry(TestCase):
    _value = {"key": "value"}
    _storage_key = "storage_key"

    def setUp(self):
        self.entry = TurnStateEntry(deepcopy(self._value), deepcopy(self._storage_key))
        print(self.entry.value)

    def test_has_changed_replace_entry(self):
        self.assertFalse(self.entry.has_changed)
        new_value = {"new_key": "new_value"}
        self.entry.replace(new_value)
        self.assertTrue(self.entry.has_changed)

    def test_init(self):
        self.assertEqual(self.entry.value, self._value)
        self.assertEqual(self.entry.storage_key, self._storage_key)
        self.assertFalse(self.entry.is_deleted)
        self.assertFalse(self.entry.has_changed)

    def test_init_no_params(self):
        entry = TurnStateEntry()
        self.assertEqual(entry.value, {})
        self.assertIsNone(entry.storage_key)
        self.assertFalse(entry.is_deleted)
        self.assertFalse(entry.has_changed)

    def test_has_changed_update_existing_key(self):
        self.assertFalse(self.entry.has_changed)
        self.entry.value["key"] = "new_value"
        self.assertTrue(self.entry.has_changed)

    def test_has_changed_add_new_key(self):
        self.assertFalse(self.entry.has_changed)
        self.entry.value["new_key"] = "new_value"
        self.assertTrue(self.entry.has_changed)

    def test_has_changed_remove_existing_key(self):
        self.assertFalse(self.entry.has_changed)
        del self.entry.value["key"]
        self.assertTrue(self.entry.has_changed)

    def test_is_deleted(self):
        self.entry.delete()
        self.assertTrue(self.entry.is_deleted)

    def test_is_deleted_when_access_again(self):
        self.entry.delete()
        self.assertTrue(self.entry.is_deleted)
        self.assertEqual(self.entry.value, {})
        self.assertFalse(self.entry.is_deleted)

    # def test_is_deleted_after_replace(self):
    #     self.entry.delete()
    #     self.assertTrue(self.entry.is_deleted)
    #     self.entry.replace({"new_key": "new_value"})
    #     self.assertFalse(self.entry.is_deleted)

    def test_replace(self):
        new_value = {"new_key": "new_value"}
        self.entry.replace(new_value)
        self.assertEqual(self.entry.value, new_value)

    def test_replace_no_value(self):
        self.entry.replace()
        self.assertEqual(self.entry.value, {})

    def test_value(self):
        self.assertEqual(self.entry.value, self._value)
        self.entry.delete()
        self.assertEqual(self.entry.value, {})
        self.assertFalse(self.entry.is_deleted)

    def test_storage_key(self):
        self.assertEqual(self.entry.storage_key, self._storage_key)

    def test_storage_key_no_provided(self):
        entry = TurnStateEntry()
        self.assertIsNone(entry.storage_key)

    def test_delete(self):
        self.assertFalse(self.entry.is_deleted)
        self.entry.delete()
        self.assertTrue(self.entry.is_deleted)
