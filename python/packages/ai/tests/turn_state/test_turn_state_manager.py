"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from typing import List
from unittest import IsolatedAsyncioTestCase

import pytest
from botbuilder.core import BotAdapter, MemoryStorage, StoreItem, TurnContext
from botbuilder.schema import (
    Activity,
    ActivityTypes,
    ChannelAccount,
    ConversationAccount,
    ResourceResponse,
)

from teams.ai.turn_state import TurnState, TurnStateEntry, TurnStateManager

ACTIVITY = Activity(
    id="1234",
    type="message",
    text="test",
    from_property=ChannelAccount(id="user", name="User Name"),
    recipient=ChannelAccount(id="bot", name="Bot Name"),
    conversation=ConversationAccount(id="convo", name="Convo Name"),
    channel_id="UnitTest",
    locale="en-uS",
    service_url="https://example.org",
)


class SimpleAdapter(BotAdapter, IsolatedAsyncioTestCase):
    async def send_activities(self, context, activities) -> List[ResourceResponse]:
        responses = []

        self.assertIsNotNone(context)
        self.assertIsNotNone(activities)
        self.assertIsInstance(activities, list)

        for _, activity in enumerate(activities):
            self.assertIsInstance(activity, Activity)
            self.assertIn(activity.type, [ActivityTypes.message, ActivityTypes.trace])
            responses.append(ResourceResponse(id="5678"))
        return responses

    async def update_activity(self, context, activity):
        self.assertIsNotNone(context)
        self.assertIsNotNone(activity)
        return ResourceResponse(id=activity.id)

    async def delete_activity(self, context, reference):
        self.assertIsNotNone(context)
        self.assertIsNotNone(reference)
        self.assertEqual(reference.activity_id, ACTIVITY.id)


class TestTurnStateManager(IsolatedAsyncioTestCase):
    manager = TurnStateManager[TurnState]()

    @pytest.mark.asyncio
    async def test_load_state_empty(self):
        storage = MemoryStorage()
        state = await self.manager.load_state(
            storage=storage, context=TurnContext(SimpleAdapter(), ACTIVITY)
        )
        self.assertIsNone(state.conversation.value)
        self.assertIsNone(state.user.value)
        self.assertIsNone(state.temp.value)

    @pytest.mark.asyncio
    async def test_load_state_non_empty(self):
        storage = MemoryStorage({"UnitTest/bot/conversations/convo": StoreItem(hello="world")})

        state = await self.manager.load_state(
            storage=storage, context=TurnContext(SimpleAdapter(), ACTIVITY)
        )
        self.assertIsInstance(state.conversation.value, StoreItem)
        self.assertIsNone(state.user.value)
        self.assertIsNone(state.temp.value)

    @pytest.mark.asyncio
    async def test_save_state(self):
        storage = MemoryStorage()
        key = "UnitTest/bot/conversations/convo"
        value = {}
        state: TurnState = {"conversation": TurnStateEntry(value=value, storage_key=key)}

        # Mutate the conversation state to so that the changes are saved.
        value["test_key"] = "test_value"
        await self.manager.save_state(storage=storage, state=state)
        value = await storage.read([key])

        self.assertEqual(value[key], {"test_key": "test_value"})
