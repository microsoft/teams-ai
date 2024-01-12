"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from unittest import IsolatedAsyncioTestCase
from unittest.mock import MagicMock

from botbuilder.core import MemoryStorage

from teams.app_error import ApplicationError
from teams.state import (
    DefaultConversationState,
    DefaultTempState,
    DefaultUserState,
    TurnState,
    TurnStateEntry,
)
from teams.state.turn_state import CONVERSATION_SCOPE, TEMP_SCOPE, USER_SCOPE


class TestTurnState(IsolatedAsyncioTestCase):
    def setUp(self):
        self.turn_state = TurnState()
        self.storage = MemoryStorage()

    def create_mock_context(
        self, channel_id="channel1", bot_id="bot1", conversation_id="conversation1", user_id="user1"
    ):
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
        conversation_key = (
            f"{context.activity.channel_id}/{context.activity.recipient.id}/conversations/"
            f"{context.activity.conversation.id}"
        )
        user_key = (
            f"{context.activity.channel_id}/{context.activity.recipient.id}/users/"
            f"{context.activity.from_property.id}"
        )
        await self.storage.write(
            {conversation_key: {"property1": "value1"}, user_key: {"property2": "value2"}}
        )  # populate some data first
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
        with self.assertRaises(Exception) as context:
            print(self.turn_state.conversation)
        self.assertEqual(
            str(context.exception), "TurnState hasn't been loaded. Call loadState() first."
        )

        # Test setter when TurnState hasn't been loaded
        with self.assertRaises(Exception) as context:
            self.turn_state.conversation = DefaultConversationState({})
        self.assertEqual(
            str(context.exception), "TurnState hasn't been loaded. Call loadState() first."
        )

    async def test_conversation_property_loaded(self):
        # Load the TurnState
        context = self.create_mock_context()
        await self.turn_state.load(context)

        # Test getter when TurnState has been loaded
        try:
            self.turn_state.conversation
        except ApplicationError:
            self.fail("self.turn_state.conversation raised Exception unexpectedly!")

        # Test setter when TurnState has been loaded
        try:
            self.turn_state.conversation = DefaultConversationState({})
        except ApplicationError:
            self.fail("self.turn_state.conversation raised Exception unexpectedly!")

    async def test_is_loaded_property_when_not_loaded(self):
        self.assertFalse(self.turn_state.is_loaded)

    async def test_is_loaded_property_when_loaded(self):
        context = self.create_mock_context()
        await self.turn_state.load(context, self.storage)
        self.assertTrue(self.turn_state.is_loaded)

    async def test_user_property_not_loaded(self):
        # Test getter when TurnState hasn't been loaded
        with self.assertRaises(Exception) as context:
            print(self.turn_state.user)
        self.assertEqual(
            str(context.exception), "TurnState hasn't been loaded. Call loadState() first."
        )

        # Test setter when TurnState hasn't been loaded
        with self.assertRaises(Exception) as context:
            self.turn_state.user = DefaultUserState({})
        self.assertEqual(
            str(context.exception), "TurnState hasn't been loaded. Call loadState() first."
        )

    async def test_user_property_loaded(self):
        # Load the TurnState
        context = self.create_mock_context()
        await self.turn_state.load(context)

        # Test getter when TurnState has been loaded
        try:
            self.turn_state.user
        except ApplicationError:
            self.fail("self.turn_state.user raised Exception unexpectedly!")

        # Test setter when TurnState has been loaded
        try:
            self.turn_state.user = DefaultUserState({})
        except ApplicationError:
            self.fail("self.turn_state.user raised Exception unexpectedly!")

    async def test_temp_property_not_loaded(self):
        # Test getter when TurnState hasn't been loaded
        with self.assertRaises(Exception) as context:
            print(self.turn_state.temp)
        self.assertEqual(
            str(context.exception), "TurnState hasn't been loaded. Call loadState() first."
        )

        # Test setter when TurnState hasn't been loaded
        with self.assertRaises(Exception) as context:
            self.turn_state.temp = DefaultTempState({})
        self.assertEqual(
            str(context.exception), "TurnState hasn't been loaded. Call loadState() first."
        )

    async def test_temp_property_loaded(self):
        # Load the TurnState
        context = self.create_mock_context()
        await self.turn_state.load(context)

        # Test getter when TurnState has been loaded
        try:
            self.turn_state.temp
        except ApplicationError:
            self.fail("self.turn_state.temp raised Exception unexpectedly!")

        # Test setter when TurnState has been loaded
        try:
            self.turn_state.temp = DefaultTempState({})
        except ApplicationError:
            self.fail("self.turn_state.temp raised Exception unexpectedly!")

    async def test_save_not_loaded(self):
        context = self.create_mock_context()
        with self.assertRaises(Exception) as context:
            await self.turn_state.save(context, self.storage)
        self.assertTrue(
            "TurnState hasn't been loaded. Call loadState() first." in str(context.exception)
        )

    async def test_save_when_loading(self):
        self.turn_state._is_loaded = False

        async def mock_loading_callable():
            self.turn_state._is_loaded = True
            self.turn_state._scopes[CONVERSATION_SCOPE] = TurnStateEntry({}, "conversation_key")
            self.turn_state._scopes[USER_SCOPE] = TurnStateEntry({}, "user_key")
            self.turn_state._scopes[TEMP_SCOPE] = TurnStateEntry({}, "temp_key")

        self.turn_state._loading_callable = mock_loading_callable
        context = self.create_mock_context()
        try:
            await self.turn_state.save(context, self.storage)
        except ApplicationError as e:
            self.fail("self.turn_state.save raised Exception unexpectedly!" + str(e))

    async def test_save_with_changes(self):
        context = self.create_mock_context()
        await self.turn_state.load(context, self.storage)
        self.turn_state.conversation.get_dict()["property1"] = "new value1"
        self.turn_state.user.get_dict()["property2"] = "new value2"
        await self.turn_state.save(context, self.storage)
        conversation_key = (
            f"{context.activity.channel_id}/{context.activity.recipient.id}/conversations/"
            f"{context.activity.conversation.id}"
        )
        user_key = (
            f"{context.activity.channel_id}/{context.activity.recipient.id}/users/"
            f"{context.activity.from_property.id}"
        )
        self.assertEqual(
            await self.storage.read([conversation_key, user_key]),
            {conversation_key: {"property1": "new value1"}, user_key: {"property2": "new value2"}},
        )

    async def test_save_with_no_changes(self):
        context = self.create_mock_context()
        await self.turn_state.load(context, self.storage)
        await self.turn_state.save(context, self.storage)
        conversation_key = (
            f"{context.activity.channel_id}/{context.activity.recipient.id}/conversations/"
            f"{context.activity.conversation.id}"
        )
        user_key = (
            f"{context.activity.channel_id}/{context.activity.recipient.id}/users/"
            f"{context.activity.from_property.id}"
        )
        self.assertEqual(await self.storage.read([conversation_key, user_key]), {})

    async def test_save_with_deletions(self):
        context = self.create_mock_context()
        conversation_key = (
            f"{context.activity.channel_id}/{context.activity.recipient.id}/conversations/"
            f"{context.activity.conversation.id}"
        )
        user_key = (
            f"{context.activity.channel_id}/{context.activity.recipient.id}/users/"
            f"{context.activity.from_property.id}"
        )
        await self.storage.write(
            {conversation_key: {"property1": "value1"}, user_key: {"property2": "value2"}}
        )  # populate some data first
        await self.turn_state.load(context, self.storage)
        self.turn_state.delete_conversation_state()
        self.turn_state.delete_user_state()
        await self.turn_state.save(context, self.storage)
        self.assertEqual(await self.storage.read([conversation_key, user_key]), {})

    async def test_save_with_no_storage(self):
        context = self.create_mock_context()
        await self.turn_state.load(context, self.storage)
        try:
            await self.turn_state.save(context)
        except ApplicationError as e:
            self.fail("self.turn_state.save raised Exception unexpectedly!" + str(e))

    async def test_delete_conversation_state(self):
        context = self.create_mock_context()
        await self.turn_state.load(context, self.storage)
        self.turn_state.delete_conversation_state()
        self.assertTrue(self.turn_state._scopes[CONVERSATION_SCOPE].is_deleted)

    async def test_delete_conversation_state_not_loaded(self):
        with self.assertRaises(Exception) as context:
            self.turn_state.delete_conversation_state()
        self.assertEqual(
            str(context.exception), "TurnState hasn't been loaded. Call loadState() first."
        )

    async def test_delete_user_state(self):
        context = self.create_mock_context()
        await self.turn_state.load(context, self.storage)
        self.turn_state.delete_user_state()
        self.assertTrue(self.turn_state._scopes[USER_SCOPE].is_deleted)

    async def test_delete_user_state_not_loaded(self):
        with self.assertRaises(Exception) as context:
            self.turn_state.delete_user_state()
        self.assertEqual(
            str(context.exception), "TurnState hasn't been loaded. Call loadState() first."
        )

    async def test_delete_temp_state(self):
        context = self.create_mock_context()
        await self.turn_state.load(context, self.storage)
        self.turn_state.delete_temp_state()
        self.assertTrue(self.turn_state._scopes[TEMP_SCOPE].is_deleted)

    async def test_delete_temp_state_not_loaded(self):
        with self.assertRaises(Exception) as context:
            self.turn_state.delete_temp_state()
        self.assertEqual(
            str(context.exception), "TurnState hasn't been loaded. Call loadState() first."
        )

    async def test_delete_value(self):
        context = self.create_mock_context()
        await self.turn_state.load(context, self.storage)
        self.turn_state.conversation.get_dict()["property1"] = "new value1"
        self.turn_state.user.get_dict()["property2"] = "new value2"
        self.turn_state.temp.get_dict()["property3"] = "new value3"
        self.turn_state.delete_value(f"{CONVERSATION_SCOPE}.property1")
        self.turn_state.delete_value(f"{USER_SCOPE}.property2")
        self.turn_state.delete_value(f"{TEMP_SCOPE}.property3")
        self.assertEqual(self.turn_state.conversation.get_dict(), {})
        self.assertEqual(self.turn_state.user.get_dict(), {})
        self.assertEqual(self.turn_state.temp.get_dict(), {})

    async def test_delete_non_exist_value(self):
        context = self.create_mock_context()
        await self.turn_state.load(context, self.storage)
        try:
            self.turn_state.delete_value(f"{CONVERSATION_SCOPE}.property1")
            self.turn_state.delete_value(f"{USER_SCOPE}.property2")
            self.turn_state.delete_value(f"{TEMP_SCOPE}.property3")
        except ApplicationError as e:
            self.fail("self.turn_state.delete_value raised Exception unexpectedly!" + str(e))

    async def test_has_value(self):
        context = self.create_mock_context()
        await self.turn_state.load(context, self.storage)
        self.turn_state.conversation.get_dict()["property1"] = "new value1"
        self.turn_state.user.get_dict()["property2"] = "new value2"
        self.turn_state.temp.get_dict()["property3"] = "new value3"
        self.assertTrue(self.turn_state.has_value(f"{CONVERSATION_SCOPE}.property1"))
        self.assertTrue(self.turn_state.has_value(f"{USER_SCOPE}.property2"))
        self.assertTrue(self.turn_state.has_value(f"{TEMP_SCOPE}.property3"))

    async def test_has_no_value(self):
        context = self.create_mock_context()
        await self.turn_state.load(context, self.storage)
        self.assertFalse(self.turn_state.has_value(f"{CONVERSATION_SCOPE}.property1"))
        self.assertFalse(self.turn_state.has_value(f"{USER_SCOPE}.property2"))
        self.assertFalse(self.turn_state.has_value(f"{TEMP_SCOPE}.property3"))

    async def test_get_value(self):
        context = self.create_mock_context()
        await self.turn_state.load(context, self.storage)
        self.turn_state.conversation.get_dict()["property1"] = "new value1"
        self.turn_state.user.get_dict()["property2"] = "new value2"
        self.turn_state.temp.get_dict()["property3"] = "new value3"
        self.assertEqual(self.turn_state.get_value(f"{CONVERSATION_SCOPE}.property1"), "new value1")
        self.assertEqual(self.turn_state.get_value(f"{USER_SCOPE}.property2"), "new value2")
        self.assertEqual(self.turn_state.get_value(f"{TEMP_SCOPE}.property3"), "new value3")

    async def test_get_non_exist_value(self):
        context = self.create_mock_context()
        await self.turn_state.load(context, self.storage)
        self.assertIsNone(self.turn_state.get_value(f"{CONVERSATION_SCOPE}.property1"))
        self.assertIsNone(self.turn_state.get_value(f"{USER_SCOPE}.property2"))
        self.assertIsNone(self.turn_state.get_value(f"{TEMP_SCOPE}.property3"))

    async def test_set_value(self):
        context = self.create_mock_context()
        await self.turn_state.load(context, self.storage)
        self.turn_state.set_value(f"{CONVERSATION_SCOPE}.property1", "new value1")
        self.turn_state.set_value(f"{USER_SCOPE}.property2", "new value2")
        self.turn_state.set_value(f"{TEMP_SCOPE}.property3", "new value3")
        self.assertEqual(self.turn_state.get_value(f"{CONVERSATION_SCOPE}.property1"), "new value1")
        self.assertEqual(self.turn_state.get_value(f"{USER_SCOPE}.property2"), "new value2")
        self.assertEqual(self.turn_state.get_value(f"{TEMP_SCOPE}.property3"), "new value3")

    async def test_set_value_overwrite(self):
        context = self.create_mock_context()
        await self.turn_state.load(context, self.storage)
        self.turn_state.set_value(f"{CONVERSATION_SCOPE}.property1", "old value1")
        self.turn_state.set_value(f"{USER_SCOPE}.property2", "old value2")
        self.turn_state.set_value(f"{TEMP_SCOPE}.property3", "old value3")
        self.turn_state.set_value(f"{CONVERSATION_SCOPE}.property1", "new value1")
        self.turn_state.set_value(f"{USER_SCOPE}.property2", "new value2")
        self.turn_state.set_value(f"{TEMP_SCOPE}.property3", "new value3")
        self.assertEqual(self.turn_state.get_value(f"{CONVERSATION_SCOPE}.property1"), "new value1")
        self.assertEqual(self.turn_state.get_value(f"{USER_SCOPE}.property2"), "new value2")
        self.assertEqual(self.turn_state.get_value(f"{TEMP_SCOPE}.property3"), "new value3")

    async def test_get_value_invalid_path(self):
        context = self.create_mock_context()
        await self.turn_state.load(context, self.storage)
        with self.assertRaises(Exception) as context:
            self.turn_state.get_value("invalid.scope.property")
        self.assertIn("Invalid state path: invalid.scope.property", str(context.exception))

    async def test_get_value_invalid_scope(self):
        context = self.create_mock_context()
        await self.turn_state.load(context, self.storage)
        with self.assertRaises(Exception) as context:
            self.turn_state.get_value("invalid.property")
        self.assertIn("Invalid state scope: invalid", str(context.exception))

    async def test_get_value_default_scope(self):
        context = self.create_mock_context()
        await self.turn_state.load(context, self.storage)
        self.turn_state.set_value(f"{CONVERSATION_SCOPE}.property1", "new value1")
        self.turn_state.set_value(f"{USER_SCOPE}.property2", "new value2")
        self.turn_state.set_value(f"{TEMP_SCOPE}.property3", "new value3")
        self.assertEqual(self.turn_state.get_value("property3"), "new value3")
