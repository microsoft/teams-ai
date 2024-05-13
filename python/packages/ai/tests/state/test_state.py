"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from unittest import IsolatedAsyncioTestCase
from unittest.mock import MagicMock

from teams.state import State


class TestState(IsolatedAsyncioTestCase):
    async def test_should_set_attribute(self):
        state = await State.load(MagicMock())
        self.assertFalse("test" in state)
        state.test = 1
        self.assertTrue("test" in state)
        self.assertEqual(state.test, 1)
        self.assertEqual(state["test"], 1)

    async def test_should_set_item(self):
        state = await State.load(MagicMock())
        self.assertFalse("test" in state)
        state["test"] = 1
        self.assertTrue("test" in state)
        self.assertEqual(state["test"], 1)
        self.assertEqual(state.test, 1)
