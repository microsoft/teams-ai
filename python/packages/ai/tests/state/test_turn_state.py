"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from unittest import IsolatedAsyncioTestCase
from unittest.mock import MagicMock

from botbuilder.core import MemoryStorage, StoreItem

from teams.state import ConversationState, TempState, TurnState, UserState

AppTurnState = TurnState[ConversationState, UserState, TempState]


class TestTurnState(IsolatedAsyncioTestCase):
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
            {
                "channel1/bot1/conversations/conversation1": StoreItem(
                    hello="world", message="hello world"
                )
            }
        )

        turn_state = await AppTurnState.load(context, storage)
        self.assertTrue("conversation" in turn_state)
        self.assertTrue("hello" in turn_state.conversation)
        self.assertEqual(turn_state.conversation["hello"], "world")
        self.assertTrue("message" in turn_state.conversation)
        self.assertEqual(turn_state.conversation["message"], "hello world")

    async def test_should_save(self):
        context = self.create_mock_context()
        storage = MemoryStorage()
        turn_state = await AppTurnState.load(context, storage)

        self.assertFalse("hello" in turn_state.conversation)
        self.assertFalse("message" in turn_state.conversation)

        turn_state.conversation["hello"] = "world"
        await turn_state.save(context, storage)
        self.assertTrue("hello" in turn_state.conversation)
        self.assertEqual(turn_state.conversation["hello"], "world")

        turn_state.conversation.message = "hello world"
        await turn_state.save(context, storage)
        self.assertTrue("message" in turn_state.conversation)
        self.assertEqual(turn_state.conversation["message"], "hello world")

    async def test_should_delete(self):
        context = self.create_mock_context()
        storage = MemoryStorage()
        turn_state = await AppTurnState.load(context, storage)

        self.assertFalse("hello" in turn_state.conversation)
        self.assertFalse("message" in turn_state.conversation)

        turn_state.conversation["hello"] = "world"
        turn_state.conversation.message = "hello world"

        await turn_state.save(context, storage)
        turn_state = await AppTurnState.load(context, storage)

        self.assertTrue("conversation" in turn_state)
        self.assertTrue("hello" in turn_state.conversation)
        self.assertEqual(turn_state.conversation["hello"], "world")
        self.assertTrue("message" in turn_state.conversation)
        self.assertEqual(turn_state.conversation["message"], "hello world")

        del turn_state.conversation
        self.assertFalse("conversation" in turn_state)

        await turn_state.save(context, storage)
        turn_state = await AppTurnState.load(context, storage)

        self.assertTrue("conversation" in turn_state)
        self.assertFalse("message" in turn_state.conversation)

    async def test_should_json(self):
        context = self.create_mock_context()
        storage = MemoryStorage()
        turn_state = await AppTurnState.load(context, storage)

        turn_state.conversation["hello"] = "world"
        await turn_state.save(context, storage)
        turn_state = await AppTurnState.load(context, storage)

        self.assertEqual(
            str(turn_state),
            '{"conversation": {"hello": "world"}, "user": {}, "temp": {"action_outputs": {},'
            ' "auth_tokens": {}, "duplicate_token_exchange": null, "input": "",'
            ' "input_files": [], "last_output": ""}}',
        )

    async def test_has(self):
        context = self.create_mock_context()
        storage = MemoryStorage()

        await storage.write(
            {
                "channel1/bot1/conversations/conversation1": StoreItem(
                    hello="world", message="hello world"
                )
            }
        )

        turn_state = await AppTurnState.load(context, storage)
        self.assertTrue(turn_state.has("conversation.hello"))
        self.assertFalse(turn_state.has("conversation.test"))

    async def test_get(self):
        context = self.create_mock_context()
        storage = MemoryStorage()

        await storage.write(
            {
                "channel1/bot1/conversations/conversation1": StoreItem(
                    hello="world", message="hello world"
                )
            }
        )

        turn_state = await AppTurnState.load(context, storage)
        self.assertEqual(turn_state.get("conversation.hello"), "world")
        self.assertIsNone(turn_state.get("conversation.test"))

    async def test_set(self):
        context = self.create_mock_context()
        storage = MemoryStorage()

        await storage.write(
            {
                "channel1/bot1/conversations/conversation1": StoreItem(
                    hello="world", message="hello world"
                )
            }
        )

        turn_state = await AppTurnState.load(context, storage)
        self.assertEqual(turn_state.get("conversation.hello"), "world")
        self.assertIsNone(turn_state.get("conversation.test"))

        turn_state.set("conversation.test", "this is a test")
        self.assertIsNotNone(turn_state.get("conversation.test"))
        self.assertEqual(turn_state.get("conversation.test"), "this is a test")

        with self.assertRaises(KeyError, msg="[TurnState.set]: 'test' is not defined"):
            turn_state.set("test.message", "my message")

    async def test_delete(self):
        context = self.create_mock_context()
        storage = MemoryStorage()

        await storage.write(
            {
                "channel1/bot1/conversations/conversation1": StoreItem(
                    hello="world", message="hello world"
                )
            }
        )

        turn_state = await AppTurnState.load(context, storage)
        self.assertEqual(turn_state.get("conversation.hello"), "world")

        turn_state.delete("conversation.hello")
        turn_state.delete("conversation.does_not_exist")
        self.assertIsNone(turn_state.get("conversation.hello"))
