"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

# pylint:disable=duplicate-code

from dataclasses import dataclass
from typing import List
from unittest import IsolatedAsyncioTestCase, mock

import pytest
from botbuilder.core import TurnContext
from botbuilder.schema import Activity, ChannelAccount, ConversationAccount

from teams import Application
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
    async def test_anonymous_query_link(self):
        handler = mock.AsyncMock()
        self.app.message_extensions.anonymous_query_link("256")(handler)
        self.assertEqual(len(self.app._routes), 1)

        @dataclass
        class Value:
            command_id: str
            url: str

        await self.app.on_turn(
            TurnContext(
                SimpleAdapter(),
                Activity(
                    id="1234",
                    type="invoke",
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
                    type="invoke",
                    name="composeExtension/anonymousQueryLink",
                    text="test",
                    value=Value("256", ""),
                    from_property=ChannelAccount(id="user", name="User Name"),
                    recipient=ChannelAccount(id="bot", name="Bot Name"),
                    conversation=ConversationAccount(id="convo", name="Convo Name"),
                    channel_id="UnitTest",
                    locale="en-uS",
                    service_url="https://example.org",
                ),
            )
        )

        handler.assert_called_once()

    @pytest.mark.asyncio
    async def test_message_preview(self):
        handler = mock.AsyncMock()
        self.app.message_extensions.message_preview("256", "edit")(handler)
        self.assertEqual(len(self.app._routes), 1)

        @dataclass
        class Value:
            command_id: str
            bot_message_preview_action: str
            bot_activity_preview: List[Activity]

        await self.app.on_turn(
            TurnContext(
                SimpleAdapter(),
                Activity(
                    id="1234",
                    type="invoke",
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
                    type="invoke",
                    name="composeExtension/submitAction",
                    text="test",
                    value=Value("256", "edit", [Activity()]),
                    from_property=ChannelAccount(id="user", name="User Name"),
                    recipient=ChannelAccount(id="bot", name="Bot Name"),
                    conversation=ConversationAccount(id="convo", name="Convo Name"),
                    channel_id="UnitTest",
                    locale="en-uS",
                    service_url="https://example.org",
                ),
            )
        )

        handler.assert_called_once()
