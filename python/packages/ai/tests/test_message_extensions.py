"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

# pylint:disable=duplicate-code

from dataclasses import dataclass
from unittest import IsolatedAsyncioTestCase, mock

import pytest
from botbuilder.core import TurnContext
from botbuilder.schema import Activity, ChannelAccount, ConversationAccount
from botbuilder.schema.teams import (
    AppBasedLinkQuery,
    MessagingExtensionAction,
    MessagingExtensionQuery,
)

from teams import Application
from tests.utils import SimpleAdapter


class TestMessageExtensions(IsolatedAsyncioTestCase):
    app: Application

    @pytest.fixture(autouse=True)
    def before_each(self):
        self.app = Application()
        yield

    @pytest.mark.asyncio
    async def test_query(self):
        handler = mock.AsyncMock()
        self.app.message_extensions.query("256")(handler)
        self.assertEqual(len(self.app._routes), 1)

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
                    name="composeExtension/query",
                    text="test",
                    value=MessagingExtensionQuery(command_id="256"),
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
    async def test_query_link(self):
        handler = mock.AsyncMock()
        self.app.message_extensions.query_link("256")(handler)
        self.assertEqual(len(self.app._routes), 1)

        @dataclass
        class Value(AppBasedLinkQuery):
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
                    name="composeExtension/queryLink",
                    text="test",
                    value=Value(command_id="256", url=""),
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
    async def test_anonymous_query_link(self):
        handler = mock.AsyncMock()
        self.app.message_extensions.anonymous_query_link("256")(handler)
        self.assertEqual(len(self.app._routes), 1)

        @dataclass
        class Value(AppBasedLinkQuery):
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
                    value=Value(command_id="256", url=""),
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
                    value=MessagingExtensionAction(
                        command_id="256",
                        bot_message_preview_action="edit",
                        bot_activity_preview=[Activity()],
                    ),
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
    async def test_fetch_task(self):
        handler = mock.AsyncMock()
        self.app.message_extensions.fetch_task("256")(handler)
        self.assertEqual(len(self.app._routes), 1)

        @dataclass
        class Value:
            command_id: str

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
                    name="composeExtension/fetchTask",
                    text="test",
                    value=Value("256"),
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
