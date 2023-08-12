"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from unittest import IsolatedAsyncioTestCase

import pytest
from botbuilder.core import MemoryStorage, StoreItem, TurnContext

from teams.ai.state import (
    ConversationState,
    TempState,
    TurnState,
    TurnStateEntry,
    TurnStateManager,
    UserState,
)
from tests.utils import ACTIVITY, SimpleAdapter


class TestTurnStateManager(IsolatedAsyncioTestCase):
    manager = TurnStateManager[TurnState[ConversationState, UserState, TempState]]()

    @pytest.mark.asyncio
    async def test_load_state_empty(self):
        storage = MemoryStorage()
        state = await self.manager.load_state(
            storage=storage, context=TurnContext(SimpleAdapter(), ACTIVITY)
        )
        self.assertEqual(state.conversation.value, ConversationState())
        self.assertEqual(state.user.value, UserState())
        self.assertEqual(state.temp.value, TempState(history="", input="", output=""))

    @pytest.mark.asyncio
    async def test_load_state_non_empty(self):
        storage = MemoryStorage({"UnitTest/bot/conversations/convo": StoreItem(hello="world")})

        state = await self.manager.load_state(
            storage=storage, context=TurnContext(SimpleAdapter(), ACTIVITY)
        )
        self.assertIsInstance(state.conversation.value, StoreItem)
        self.assertEqual(state.user.value, UserState())
        self.assertEqual(state.temp.value, TempState(history="", input="", output=""))

    @pytest.mark.asyncio
    async def test_save_state(self):
        class CustomConversationState(ConversationState):
            test: str

        manager = TurnStateManager[TurnState[CustomConversationState, UserState, TempState]]()
        storage = MemoryStorage()
        key = "UnitTest/bot/conversations/convo"
        value = CustomConversationState(test="a")
        state = TurnState[CustomConversationState, UserState, TempState](
            conversation=TurnStateEntry(value, storage_key=key),
            user=TurnStateEntry(UserState()),
            temp=TurnStateEntry(TempState(history="", input="", output="")),
        )

        # Mutate the conversation state to so that the changes are saved.
        value["test"] = "b"
        await manager.save_state(storage, TurnContext(SimpleAdapter(), ACTIVITY), state)
        value = await storage.read([key])

        self.assertEqual(value[key], {"test": "b"})
