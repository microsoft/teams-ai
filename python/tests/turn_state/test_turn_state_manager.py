"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

import pytest

from unittest import TestCase
from typing import List
from teams_ai.turn_state import TurnStateManager, TurnState, TurnStateEntry
from botbuilder.core import MemoryStorage, StoreItem, TurnContext, BotAdapter
from botbuilder.schema import (
    Activity,
    ActivityTypes,
    ChannelAccount,
    ConversationAccount,
    ResourceResponse,
)

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


class SimpleAdapter(BotAdapter):

    async def send_activities(self, context,
                              activities) -> List[ResourceResponse]:
        responses = []
        assert context is not None
        assert activities is not None
        assert isinstance(activities, list)
        assert activities
        for (_, activity) in enumerate(activities):
            assert isinstance(activity, Activity)
            assert activity.type == "message" or activity.type == ActivityTypes.trace
            responses.append(ResourceResponse(id="5678"))
        return responses

    async def update_activity(self, context, activity):
        assert context is not None
        assert activity is not None
        return ResourceResponse(id=activity.id)

    async def delete_activity(self, context, reference):
        assert context is not None
        assert reference is not None
        assert reference.activity_id == ACTIVITY.id


class TestTurnStateManager:
    manager = TurnStateManager[TurnState]()

    @pytest.mark.asyncio
    async def test_load_state_empty(self):
        storage = MemoryStorage()
        state = await self.manager.load_state(storage=storage,
                                              context=TurnContext(
                                                  SimpleAdapter(), ACTIVITY))
        assert state["conversation"].empty is True
        assert state["user"].empty is True
        assert state["temp"].empty is True

    @pytest.mark.asyncio
    async def test_load_state_non_empty(self):
        storage = MemoryStorage(
            {f"UnitTest/bot/conversations/convo": StoreItem(hello="world")})

        state = await self.manager.load_state(storage=storage,
                                              context=TurnContext(
                                                  SimpleAdapter(), ACTIVITY))
        TestCase().assertIsInstance(state["conversation"].value, StoreItem)
        assert state["user"].empty is True
        assert state["temp"].empty is True

    @pytest.mark.asyncio
    async def test_save_state(self):
        storage = MemoryStorage()
        key = f"UnitTest/bot/conversations/convo"
        state: TurnState = {
            "conversation":
            TurnStateEntry(value=StoreItem(hello="world"), storage_key=key)
        }

        await self.manager.save_state(storage=storage, state=state)
        value = await storage.read([key])

        TestCase().assertIsInstance(value[key], StoreItem)
