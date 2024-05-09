"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from typing import Any, Dict, Optional
from unittest import IsolatedAsyncioTestCase
from unittest.mock import MagicMock

from botbuilder.core import MemoryStorage, Storage, StoreItem, TurnContext

from teams.state import ConversationState, State, TurnState, UserState, state


class CustomConversationState(ConversationState):
    message: Optional[str] = None

    @classmethod
    async def load(
        cls, context: TurnContext, storage: Optional[Storage] = None
    ) -> "CustomConversationState":
        value = await super().load(context, storage)
        return cls(**value, message=value["message"] or None)


class CustomUserState(UserState):
    name: Optional[str] = None

    @classmethod
    async def load(
        cls, context: TurnContext, storage: Optional[Storage] = None
    ) -> "CustomUserState":
        value = await super().load(context, storage)
        return cls(**value, name=value["name"] or None)


@state
class OtherState(State):
    test: int = 0

    @classmethod
    async def load(cls, context: TurnContext, storage: Optional[Storage] = None) -> "OtherState":
        if not storage:
            return cls(__key__="other")

        data: Dict[str, Any] = await storage.read(["other"])

        if "other" in data:
            if isinstance(data["other"], StoreItem):
                return cls(__key__="other", **vars(data["other"]))
            return cls(__key__="other", **data["other"])
        return cls(__key__="other")


class CustomTurnState(TurnState):
    conversation: CustomConversationState
    user: CustomUserState
    other: OtherState

    @classmethod
    async def load(
        cls, context: TurnContext, storage: Optional[Storage] = None
    ) -> "CustomTurnState":
        value = await super().load(context, storage)
        return cls(**value, other=await OtherState.load(context, storage))


class TestCustomTurnState(IsolatedAsyncioTestCase):
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

        turn_state = await CustomTurnState.load(context, storage)
        self.assertTrue("conversation" in turn_state)
        self.assertTrue("hello" in turn_state.conversation)
        self.assertEqual(turn_state.conversation["hello"], "world")
        self.assertTrue("message" in turn_state.conversation)
        self.assertEqual(turn_state.conversation.message, "hello world")

        self.assertTrue("other" in turn_state)
        self.assertEqual(turn_state.other.test, 0)

    async def test_should_save(self):
        context = self.create_mock_context()
        storage = MemoryStorage()
        turn_state = await CustomTurnState.load(context, storage)

        self.assertFalse("hello" in turn_state.conversation)
        self.assertFalse("message" in turn_state.conversation)

        turn_state.conversation["hello"] = "world"
        await turn_state.save(context, storage)
        self.assertTrue("hello" in turn_state.conversation)
        self.assertEqual(turn_state.conversation["hello"], "world")

        turn_state.conversation.message = "hello world"
        await turn_state.save(context, storage)
        self.assertTrue("message" in turn_state.conversation)
        self.assertEqual(turn_state.conversation.message, "hello world")

    async def test_should_delete(self):
        context = self.create_mock_context()
        storage = MemoryStorage()
        turn_state = await CustomTurnState.load(context, storage)

        self.assertFalse("hello" in turn_state.conversation)
        self.assertFalse("message" in turn_state.conversation)

        turn_state.conversation["hello"] = "world"
        turn_state.conversation.message = "hello world"

        await turn_state.save(context, storage)
        turn_state = await CustomTurnState.load(context, storage)

        self.assertTrue("conversation" in turn_state)
        self.assertTrue("hello" in turn_state.conversation)
        self.assertEqual(turn_state.conversation["hello"], "world")
        self.assertTrue("message" in turn_state.conversation)
        self.assertEqual(turn_state.conversation.message, "hello world")

        self.assertTrue("other" in turn_state)
        self.assertEqual(turn_state.other.test, 0)

        del turn_state.conversation
        self.assertFalse("conversation" in turn_state)

        await turn_state.save(context, storage)
        turn_state = await CustomTurnState.load(context, storage)

        self.assertTrue("conversation" in turn_state)
        self.assertFalse("message" in turn_state.conversation)

        self.assertTrue("other" in turn_state)
        self.assertEqual(turn_state.other.test, 0)

    async def test_should_json(self):
        context = self.create_mock_context()
        storage = MemoryStorage()
        turn_state = await CustomTurnState.load(context, storage)

        self.assertTrue("test" in turn_state.other)
        turn_state.other.test = 100

        await turn_state.save(context, storage)
        turn_state = await CustomTurnState.load(context, storage)

        self.assertTrue("other" in turn_state)
        self.assertTrue("test" in turn_state.other)
        self.assertEqual(turn_state.other.test, 100)
        self.assertEqual(str(turn_state.other), '{"test": 100}')
        self.assertEqual(
            str(turn_state),
            '{"conversation": {}, "user": {}, "temp": {"action_outputs": {}, "auth_tokens": {},'
            ' "duplicate_token_exchange": null, "input": "", "input_files": [], "last_output": ""},'
            ' "other": {"test": 100}}',
        )
