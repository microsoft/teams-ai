"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from unittest import IsolatedAsyncioTestCase
from unittest.mock import MagicMock

from botbuilder.core import MemoryStorage, StoreItem

from teams.state import UserState


class TestUserState(IsolatedAsyncioTestCase):
    def create_mock_context(
        self, channel_id="channel1", bot_id="bot1", conversation_id="conversation1", user_id="user1"
    ):
        context = MagicMock()
        context.activity.channel_id = channel_id
        context.activity.recipient.id = bot_id
        context.activity.conversation.id = conversation_id
        context.activity.from_property.id = user_id
        return context

    async def test_should_load(self):
        context = self.create_mock_context()
        storage = MemoryStorage()

        await storage.write(
            {"channel1/bot1/users/user1": StoreItem(hello="world", message="hello world")}
        )

        state = await UserState.load(context, storage)
        self.assertEqual(state.__key__, "channel1/bot1/users/user1")
        self.assertTrue("hello" in state)
        self.assertEqual(state["hello"], "world")
        self.assertTrue("message" in state)
        self.assertEqual(state["message"], "hello world")
        self.assertEqual(str(state), '{"hello": "world", "message": "hello world"}')

    async def test_should_save(self):
        context = self.create_mock_context()
        storage = MemoryStorage()
        state = await UserState.load(context, storage)

        self.assertEqual(state.__key__, "channel1/bot1/users/user1")
        self.assertFalse("hello" in state)
        self.assertFalse("message" in state)

        state["hello"] = "world"
        state["message"] = "hello world"
        await state.save(context, storage)
        state = await UserState.load(context, storage)

        self.assertEqual(state.__key__, "channel1/bot1/users/user1")
        self.assertTrue("hello" in state)
        self.assertEqual(state["hello"], "world")
        self.assertTrue("message" in state)
        self.assertEqual(state["message"], "hello world")
        self.assertEqual(str(state), '{"hello": "world", "message": "hello world"}')

    async def test_should_not_load_when_channel_missing(self):
        context = MagicMock()
        context.activity.channel_id = None
        storage = MemoryStorage()

        await storage.write(
            {"channel1/bot1/users/user1": StoreItem(hello="world", message="hello world")}
        )

        with self.assertRaises(ValueError, msg="missing activity.channel_id"):
            await UserState.load(context, storage)

    async def test_should_not_load_when_from_property_missing(self):
        context = MagicMock()
        context.activity.channel_id = "channel1"
        context.activity.from_property = None
        storage = MemoryStorage()

        await storage.write(
            {"channel1/bot1/users/user1": StoreItem(hello="world", message="hello world")}
        )

        with self.assertRaises(ValueError, msg="missing activity.from_property"):
            await UserState.load(context, storage)

    async def test_should_not_load_when_recipient_missing(self):
        context = MagicMock()
        context.activity.channel_id = "channel1"
        context.activity.from_property = MagicMock(id="user1")
        context.activity.recipient = None
        storage = MemoryStorage()

        await storage.write(
            {"channel1/bot1/users/user1": StoreItem(hello="world", message="hello world")}
        )

        with self.assertRaises(ValueError, msg="missing activity.recipient"):
            await UserState.load(context, storage)
