"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from unittest import IsolatedAsyncioTestCase
from unittest.mock import MagicMock
from teams.state import TurnState, DefaultConversationState, DefaultUserState, DefaultTempState
from botbuilder.core import MemoryStorage

class TestConversationState(DefaultConversationState):
    def __init__(self):
        super().__init__()
        
    @property
    def property1(self):
        return self._dict.get("property1", None)
    
    @property1.setter
    def property1(self, value):
        self._dict["property1"] = value

class TestUserState(DefaultUserState):
    def __init__(self):
        super().__init__()

    @property
    def property2(self):
        return self._dict.get("property2", None)
    
    @property2.setter
    def property2(self, value):
        self._dict["property2"] = value

class TestTurnState(IsolatedAsyncioTestCase):
    def setUp(self):
        self.turn_state = TurnState()
        self.storage = MemoryStorage()

    def create_mock_context(self, channel_id="channel1", bot_id="bot1", conversation_id="conversation1", user_id="user1"):
        context = MagicMock()
        context.activity.channel_id = channel_id
        context.activity.recipient.id = bot_id
        context.activity.conversation.id = conversation_id
        context.activity.from_property.id = user_id
        return context

    async def test_load_first_call(self):
        context = self.create_mock_context()
        result = await self.turn_state.load(context, self.storage)
        self.assertTrue(result)
        self.assertTrue(self.turn_state.is_loaded)
        self.assertIsNotNone(self.turn_state.conversation)
        self.assertIsNotNone(self.turn_state.user)
        self.assertIsNotNone(self.turn_state.temp)

    async def test_load_subsequent_call(self):
        context = self.create_mock_context()
        await self.turn_state.load(context, self.storage)  # first call
        result = await self.turn_state.load(context, self.storage)  # second call
        self.assertFalse(result)

    async def test_load_existing_data(self):
        context = self.create_mock_context()
        conversation_key = f"{context.activity.channel_id}/{context.activity.recipient.id}/conversations/{context.activity.conversation.id}"
        user_key = f"{context.activity.channel_id}/{context.activity.recipient.id}/users/{context.activity.from_property.id}"
        await self.storage.write({
            conversation_key: {"property1": "value1"},
            user_key: {"property2": "value2"}
        })  # populate some data first
        await self.turn_state.load(context, self.storage)
        self.assertTrue(self.turn_state.is_loaded)
        self.assertEqual(self.turn_state.conversation.get_dict(), {"property1": "value1"})
        self.assertEqual(self.turn_state.user.get_dict(), {"property2": "value2"})  

    async def test_load_no_storage(self):
        context = self.create_mock_context()
        result = await self.turn_state.load(context)
        self.assertTrue(result)
        self.assertTrue(self.turn_state.is_loaded)
        self.assertIsNotNone(self.turn_state.conversation)
        self.assertIsNotNone(self.turn_state.user)
        self.assertIsNotNone(self.turn_state.temp)

    async def test_load_exception(self):
        context = self.create_mock_context(channel_id=None)  # This will cause an exception
        with self.assertRaises(ValueError):
            await self.turn_state.load(context, self.storage)

    async def test_load_invalid_context(self):
        # Test with missing channel_id
        context = self.create_mock_context(channel_id=None)
        with self.assertRaisesRegex(ValueError, "missing activity.channel_id"):
            await self.turn_state.load(context, self.storage)

        # Test with missing bot_id
        context = self.create_mock_context(bot_id=None)
        with self.assertRaisesRegex(ValueError, "missing activity.recipient.id"):
            await self.turn_state.load(context, self.storage)

        # Test with missing conversation_id
        context = self.create_mock_context(conversation_id=None)
        with self.assertRaisesRegex(ValueError, "missing activity.conversation.id"):
            await self.turn_state.load(context, self.storage)

        # Test with missing user_id
        context = self.create_mock_context(user_id=None)
        with self.assertRaisesRegex(ValueError, "missing activity.from_property.id"):
            await self.turn_state.load(context, self.storage)

    async def test_conversation_property_not_loaded(self):
        # Test getter when TurnState hasn't been loaded
        with self.assertRaisesRegex(Exception, "TurnState hasn't been loaded\. Call loadState\(\) first\."):
            conversation_state = self.turn_state.conversation

        # Test setter when TurnState hasn't been loaded
        with self.assertRaisesRegex(Exception, "TurnState hasn't been loaded\. Call loadState\(\) first\."):
            self.turn_state.conversation = DefaultConversationState({})

    async def test_conversation_property_loaded(self):
        # Load the TurnState
        context = self.create_mock_context()
        await self.turn_state.load(context)

        # Test getter when TurnState has been loaded
        try:
            self.turn_state.conversation
        except Exception:
            self.fail("self.turn_state.conversation raised Exception unexpectedly!")

        # Test setter when TurnState has been loaded
        try:
            self.turn_state.conversation = DefaultConversationState({})
        except Exception:
            self.fail("self.turn_state.conversation raised Exception unexpectedly!")

    async def test_is_loaded_property_when_not_loaded(self):
            self.assertFalse(self.turn_state.is_loaded)

    async def test_is_loaded_property_when_loaded(self):
        context = self.create_mock_context()
        await self.turn_state.load(context, self.storage)
        self.assertTrue(self.turn_state.is_loaded)

    async def test_user_property_not_loaded(self):
        # Test getter when TurnState hasn't been loaded
        with self.assertRaisesRegex(Exception, "TurnState hasn't been loaded\. Call loadState\(\) first\."):
            user_state = self.turn_state.user

        # Test setter when TurnState hasn't been loaded
        with self.assertRaisesRegex(Exception, "TurnState hasn't been loaded\. Call loadState\(\) first\."):
            self.turn_state.user = DefaultUserState({})

    async def test_user_property_loaded(self):
        # Load the TurnState
        context = self.create_mock_context()
        await self.turn_state.load(context)

        # Test getter when TurnState has been loaded
        try:
            self.turn_state.user
        except Exception:
            self.fail("self.turn_state.user raised Exception unexpectedly!")

        # Test setter when TurnState has been loaded
        try:
            self.turn_state.user = DefaultUserState({})
        except Exception:
            self.fail("self.turn_state.user raised Exception unexpectedly!")

    async def test_temp_property_not_loaded(self):
        # Test getter when TurnState hasn't been loaded
        with self.assertRaisesRegex(Exception, "TurnState hasn't been loaded\. Call loadState\(\) first\."):
            temp_state = self.turn_state.temp

        # Test setter when TurnState hasn't been loaded
        with self.assertRaisesRegex(Exception, "TurnState hasn't been loaded\. Call loadState\(\) first\."):
            self.turn_state.temp = DefaultTempState({})

    async def test_temp_property_loaded(self):
        # Load the TurnState
        context = self.create_mock_context()
        await self.turn_state.load(context)

        # Test getter when TurnState has been loaded
        try:
            self.turn_state.temp
        except Exception:
            self.fail("self.turn_state.temp raised Exception unexpectedly!")

        # Test setter when TurnState has been loaded
        try:
            self.turn_state.temp = DefaultTempState({})
        except Exception:
            self.fail("self.turn_state.temp raised Exception unexpectedly!")

    async def test_save_not_loaded(self):
        context = self.create_mock_context()
        with self.assertRaises(Exception) as context:
            await self.turn_state.save(context, self.storage)
        self.assertTrue("TurnState hasn't been loaded. Call loadState() first." in str(context.exception))

    async def test_save_with_changes(self):
        context = self.create_mock_context()
        await self.turn_state.load(context, self.storage)
        self.turn_state.conversation.get_dict()["property1"] = "new value1"
        self.turn_state.user.get_dict()["property2"] = "new value2"
        await self.turn_state.save(context, self.storage)
        conversation_key = f"{context.activity.channel_id}/{context.activity.recipient.id}/conversations/{context.activity.conversation.id}"
        user_key = f"{context.activity.channel_id}/{context.activity.recipient.id}/users/{context.activity.from_property.id}"
        self.assertEqual(await self.storage.read([conversation_key, user_key]), {conversation_key: {'property1': 'new value1'}, user_key: {'property2': 'new value2'}})

    async def test_save_with_no_changes(self):
        context = self.create_mock_context()
        await self.turn_state.load(context, self.storage)
        await self.turn_state.save(context, self.storage)
        conversation_key = f"{context.activity.channel_id}/{context.activity.recipient.id}/conversations/{context.activity.conversation.id}"
        user_key = f"{context.activity.channel_id}/{context.activity.recipient.id}/users/{context.activity.from_property.id}"
        self.assertEqual(await self.storage.read([conversation_key, user_key]), {})