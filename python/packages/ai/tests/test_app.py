"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

# pylint:disable=duplicate-code

from unittest import IsolatedAsyncioTestCase, mock

import pytest
from botbuilder.core import TurnContext
from botbuilder.schema import Activity, ChannelAccount, ConversationAccount

from teams import Application
from teams.message_reaction_types import MessageReactionTypes
from tests.utils import SimpleAdapter


class TestApp(IsolatedAsyncioTestCase):
    app: Application

    @pytest.fixture(autouse=True)
    def before_each(self):
        self.app = Application()
        yield

    @pytest.mark.asyncio
    async def test_activity(self):
        on_event = mock.AsyncMock()
        self.app.activity("event")(on_event)
        self.assertEqual(len(self.app._routes), 1)

        await self.app.on_turn(
            TurnContext(
                SimpleAdapter(),
                Activity(
                    id="1234",
                    type="event",
                    text="test",
                    from_property=ChannelAccount(id="user", name="User Name"),
                    recipient=ChannelAccount(id="bot", name="Bot Name"),
                    conversation=ConversationAccount(id="convo", name="Convo Name"),
                    channel_id="UnitTest",
                    locale="en-uS",
                    service_url="https://example.org",
                ),
            )
        )

        await self.app.on_turn(
            TurnContext(
                SimpleAdapter(),
                Activity(
                    id="1234",
                    type="message",
                    text="test",
                    from_property=ChannelAccount(id="user", name="User Name"),
                    recipient=ChannelAccount(id="bot", name="Bot Name"),
                    conversation=ConversationAccount(id="convo", name="Convo Name"),
                    channel_id="UnitTest",
                    locale="en-uS",
                    service_url="https://example.org",
                ),
            )
        )

        on_event.assert_called_once()

    @pytest.mark.asyncio
    async def test_message(self):
        on_message = mock.AsyncMock()
        self.app.message("/history")(on_message)
        self.assertEqual(len(self.app._routes), 1)

        await self.app.on_turn(
            TurnContext(
                SimpleAdapter(),
                Activity(
                    id="1234",
                    type="event",
                    text="test",
                    from_property=ChannelAccount(id="user", name="User Name"),
                    recipient=ChannelAccount(id="bot", name="Bot Name"),
                    conversation=ConversationAccount(id="convo", name="Convo Name"),
                    channel_id="UnitTest",
                    locale="en-uS",
                    service_url="https://example.org",
                ),
            )
        )

        await self.app.on_turn(
            TurnContext(
                SimpleAdapter(),
                Activity(
                    id="1234",
                    type="message",
                    text="/history",
                    from_property=ChannelAccount(id="user", name="User Name"),
                    recipient=ChannelAccount(id="bot", name="Bot Name"),
                    conversation=ConversationAccount(id="convo", name="Convo Name"),
                    channel_id="UnitTest",
                    locale="en-uS",
                    service_url="https://example.org",
                ),
            )
        )

        on_message.assert_called_once()

    @pytest.mark.asyncio
    async def test_conversation_update(self):
        on_member_added = mock.AsyncMock()
        self.app.conversation_update("membersAdded")(on_member_added)
        self.assertEqual(len(self.app._routes), 1)

        await self.app.on_turn(
            TurnContext(
                SimpleAdapter(),
                Activity(
                    id="1234",
                    type="conversationUpdate",
                    text="test",
                    from_property=ChannelAccount(id="user", name="User Name"),
                    recipient=ChannelAccount(id="bot", name="Bot Name"),
                    conversation=ConversationAccount(id="convo", name="Convo Name"),
                    channel_id="UnitTest",
                    locale="en-uS",
                    service_url="https://example.org",
                    members_added=[ChannelAccount(id="user-2", name="User Name 2")],
                ),
            )
        )

        await self.app.on_turn(
            TurnContext(
                SimpleAdapter(),
                Activity(
                    id="1234",
                    type="conversationUpdate",
                    text="test",
                    from_property=ChannelAccount(id="user", name="User Name"),
                    recipient=ChannelAccount(id="bot", name="Bot Name"),
                    conversation=ConversationAccount(id="convo", name="Convo Name"),
                    channel_id="UnitTest",
                    locale="en-uS",
                    service_url="https://example.org",
                ),
            )
        )

        on_member_added.assert_called_once()

    @pytest.mark.asyncio
    async def test_message_reaction(self):
        on_reactions_added = mock.AsyncMock()
        on_reactions_removed = mock.AsyncMock()
        self.app.message_reaction("reactionsAdded")(on_reactions_added)
        self.app.message_reaction("reactionsRemoved")(on_reactions_removed)
        self.assertEqual(len(self.app._routes), 2)

        await self.app.on_turn(
            TurnContext(
                SimpleAdapter(),
                Activity(
                    id="1234",
                    type="messageReaction",
                    text="test",
                    from_property=ChannelAccount(id="user", name="User Name"),
                    recipient=ChannelAccount(id="bot", name="Bot Name"),
                    conversation=ConversationAccount(id="convo", name="Convo Name"),
                    channel_id="UnitTest",
                    locale="en-uS",
                    service_url="https://example.org",
                    reactions_added=[{type: MessageReactionTypes.LIKE}],
                ),
            )
        )

        await self.app.on_turn(
            TurnContext(
                SimpleAdapter(),
                Activity(
                    id="1234",
                    type="messageReaction",
                    text="test",
                    from_property=ChannelAccount(id="user", name="User Name"),
                    recipient=ChannelAccount(id="bot", name="Bot Name"),
                    conversation=ConversationAccount(id="convo", name="Convo Name"),
                    channel_id="UnitTest",
                    locale="en-uS",
                    service_url="https://example.org",
                    reactions_removed=[{type: MessageReactionTypes.PLUS_ONE}],
                ),
            )
        )

        on_reactions_added.assert_called_once()
        on_reactions_removed.assert_called_once()

    @pytest.mark.asyncio
    async def test_message_update(self):
        on_edit_message = mock.AsyncMock()
        on_soft_delete_message = mock.AsyncMock()
        on_undelete_message = mock.AsyncMock()
        self.app.message_update("editMessage")(on_edit_message)
        self.app.message_update("softDeleteMessage")(on_soft_delete_message)
        self.app.message_update("undeleteMessage")(on_undelete_message)
        self.assertEqual(len(self.app._routes), 3)

        await self.app.on_turn(
            TurnContext(
                SimpleAdapter(),
                Activity(
                    id="1234",
                    type="messageUpdate",
                    text="test",
                    from_property=ChannelAccount(id="user", name="User Name"),
                    recipient=ChannelAccount(id="bot", name="Bot Name"),
                    conversation=ConversationAccount(id="convo", name="Convo Name"),
                    channel_id="UnitTest",
                    channel_data={"event_type": "editMessage"},
                    locale="en-uS",
                    service_url="https://example.org",
                ),
            )
        )

        await self.app.on_turn(
            TurnContext(
                SimpleAdapter(),
                Activity(
                    id="1234",
                    type="messageDelete",
                    text="test",
                    from_property=ChannelAccount(id="user", name="User Name"),
                    recipient=ChannelAccount(id="bot", name="Bot Name"),
                    conversation=ConversationAccount(id="convo", name="Convo Name"),
                    channel_id="UnitTest",
                    channel_data={"event_type": "softDeleteMessage"},
                    locale="en-uS",
                    service_url="https://example.org",
                ),
            )
        )

        await self.app.on_turn(
            TurnContext(
                SimpleAdapter(),
                Activity(
                    id="1234",
                    type="messageUpdate",
                    text="test",
                    from_property=ChannelAccount(id="user", name="User Name"),
                    recipient=ChannelAccount(id="bot", name="Bot Name"),
                    conversation=ConversationAccount(id="convo", name="Convo Name"),
                    channel_id="UnitTest",
                    channel_data={"event_type": "undeleteMessage"},
                    locale="en-uS",
                    service_url="https://example.org",
                ),
            )
        )

        on_edit_message.assert_called_once()
        on_soft_delete_message.assert_called_once()
        on_undelete_message.assert_called_once()
