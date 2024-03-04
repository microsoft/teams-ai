"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from unittest import IsolatedAsyncioTestCase
from unittest.mock import MagicMock

from botbuilder.core import MemoryStorage

from teams.state import TempState


class TestTempState(IsolatedAsyncioTestCase):
    async def test_should_load(self):
        context = MagicMock()
        storage = MemoryStorage()
        state = await TempState.load(context, storage)

        self.assertEqual(state.__key__, "")
        self.assertEqual(state.input, "")
        self.assertEqual(state.input_files, [])
        self.assertEqual(state.last_output, "")
        self.assertEqual(state.action_outputs, {})
        self.assertEqual(state.auth_tokens, {})
        self.assertEqual(state.duplicate_token_exchange, None)

    async def test_should_not_save(self):
        context = MagicMock()
        storage = MemoryStorage()
        state = await TempState.load(context, storage)

        self.assertEqual(state.__key__, "")
        self.assertEqual(state.input, "")
        self.assertEqual(state.input_files, [])
        self.assertEqual(state.last_output, "")
        self.assertEqual(state.action_outputs, {})
        self.assertEqual(state.auth_tokens, {})
        self.assertEqual(state.duplicate_token_exchange, None)

        state.input = "my test input"
        await state.save(context, storage)
        state = await TempState.load(context, storage)

        self.assertEqual(state.__key__, "")
        self.assertEqual(state.input, "")
        self.assertEqual(state.input_files, [])
        self.assertEqual(state.last_output, "")
        self.assertEqual(state.action_outputs, {})
        self.assertEqual(state.auth_tokens, {})
        self.assertEqual(state.duplicate_token_exchange, None)
