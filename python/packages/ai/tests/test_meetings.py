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
from tests.utils import SimpleAdapter


class TestMeetings(IsolatedAsyncioTestCase):
    app: Application

    @pytest.fixture(autouse=True)
    def before_each(self):
        self.app = Application()
        yield

    @pytest.mark.asyncio
    async def test_start(self):
        handler = mock.AsyncMock()
        self.app.meetings.start()(handler)
        self.assertEqual(len(self.app._routes), 1)

        await self.app.on_turn(
            TurnContext(
                SimpleAdapter(),
                Activity(
                    id="1234",
                    type="event",
                    text="test",
                    name="application/vnd.microsoft.meetingStart",
                    from_property=ChannelAccount(id="user", name="User Name"),
                    recipient=ChannelAccount(id="bot", name="Bot Name"),
                    conversation=ConversationAccount(id="convo", name="Convo Name"),
                    channel_id="msteams",
                    locale="en-uS",
                    service_url="https://example.org",
                    value={
                        "meetingType": "scheduled",
                        "startTime": "2020-10-01T00:00:00.000Z",
                        "endTime": "2020-10-01T00:30:00.000Z",
                    },
                ),
            )
        )

        handler.assert_called_once()

    @pytest.mark.asyncio
    async def test_start_with_invalid_name(self):
        handler = mock.AsyncMock()
        self.app.meetings.start()(handler)
        self.assertEqual(len(self.app._routes), 1)

        await self.app.on_turn(
            TurnContext(
                SimpleAdapter(),
                Activity(
                    id="1234",
                    type="event",
                    text="test",
                    name="application/vnd.microsoft.meeting",
                    from_property=ChannelAccount(id="user", name="User Name"),
                    recipient=ChannelAccount(id="bot", name="Bot Name"),
                    conversation=ConversationAccount(id="convo", name="Convo Name"),
                    channel_id="msteams",
                    locale="en-uS",
                    service_url="https://example.org",
                    value={
                        "meetingType": "scheduled",
                        "startTime": "2020-10-01T00:00:00.000Z",
                        "endTime": "2020-10-01T00:30:00.000Z",
                    },
                ),
            )
        )

        handler.assert_not_called()

    @pytest.mark.asyncio
    async def test_start_with_missing_value(self):
        handler = mock.AsyncMock()
        self.app.meetings.start()(handler)
        self.assertEqual(len(self.app._routes), 1)

        await self.app.on_turn(
            TurnContext(
                SimpleAdapter(),
                Activity(
                    id="1234",
                    type="event",
                    text="test",
                    name="application/vnd.microsoft.meetingStart",
                    from_property=ChannelAccount(id="user", name="User Name"),
                    recipient=ChannelAccount(id="bot", name="Bot Name"),
                    conversation=ConversationAccount(id="convo", name="Convo Name"),
                    channel_id="msteams",
                    locale="en-uS",
                    service_url="https://example.org",
                ),
            )
        )

        handler.assert_not_called()

    @pytest.mark.asyncio
    async def test_start_with_wrong_type(self):
        handler = mock.AsyncMock()
        self.app.meetings.start()(handler)
        self.assertEqual(len(self.app._routes), 1)

        await self.app.on_turn(
            TurnContext(
                SimpleAdapter(),
                Activity(
                    id="1234",
                    type="invoke",
                    text="test",
                    name="application/vnd.microsoft.meetingStart",
                    from_property=ChannelAccount(id="user", name="User Name"),
                    recipient=ChannelAccount(id="bot", name="Bot Name"),
                    conversation=ConversationAccount(id="convo", name="Convo Name"),
                    channel_id="msteams",
                    locale="en-uS",
                    service_url="https://example.org",
                    value={
                        "meetingType": "scheduled",
                        "startTime": "2020-10-01T00:00:00.000Z",
                        "endTime": "2020-10-01T00:30:00.000Z",
                    },
                ),
            )
        )

        handler.assert_not_called()

    @pytest.mark.asyncio
    async def test_start_with_wrong_channel(self):
        handler = mock.AsyncMock()
        self.app.meetings.start()(handler)
        self.assertEqual(len(self.app._routes), 1)

        await self.app.on_turn(
            TurnContext(
                SimpleAdapter(),
                Activity(
                    id="1234",
                    type="event",
                    text="test",
                    name="application/vnd.microsoft.meetingStart",
                    from_property=ChannelAccount(id="user", name="User Name"),
                    recipient=ChannelAccount(id="bot", name="Bot Name"),
                    conversation=ConversationAccount(id="convo", name="Convo Name"),
                    channel_id="team",
                    locale="en-uS",
                    service_url="https://example.org",
                    value={
                        "meetingType": "scheduled",
                        "startTime": "2020-10-01T00:00:00.000Z",
                        "endTime": "2020-10-01T00:30:00.000Z",
                    },
                ),
            )
        )

        handler.assert_not_called()

    @pytest.mark.asyncio
    async def test_end(self):
        handler = mock.AsyncMock()
        self.app.meetings.end()(handler)
        self.assertEqual(len(self.app._routes), 1)

        await self.app.on_turn(
            TurnContext(
                SimpleAdapter(),
                Activity(
                    id="1234",
                    type="event",
                    text="test",
                    name="application/vnd.microsoft.meetingEnd",
                    from_property=ChannelAccount(id="user", name="User Name"),
                    recipient=ChannelAccount(id="bot", name="Bot Name"),
                    conversation=ConversationAccount(id="convo", name="Convo Name"),
                    channel_id="msteams",
                    locale="en-uS",
                    service_url="https://example.org",
                    value={
                        "meetingType": "scheduled",
                        "startTime": "2020-10-01T00:00:00.000Z",
                        "endTime": "2020-10-01T00:30:00.000Z",
                    },
                ),
            )
        )

        handler.assert_called_once()

    @pytest.mark.asyncio
    async def test_end_with_missing_value(self):
        handler = mock.AsyncMock()
        self.app.meetings.end()(handler)
        self.assertEqual(len(self.app._routes), 1)

        await self.app.on_turn(
            TurnContext(
                SimpleAdapter(),
                Activity(
                    id="1234",
                    type="event",
                    text="test",
                    name="application/vnd.microsoft.meetingEnd",
                    from_property=ChannelAccount(id="user", name="User Name"),
                    recipient=ChannelAccount(id="bot", name="Bot Name"),
                    conversation=ConversationAccount(id="convo", name="Convo Name"),
                    channel_id="msteams",
                    locale="en-uS",
                    service_url="https://example.org",
                ),
            )
        )

        handler.assert_not_called()

    @pytest.mark.asyncio
    async def test_end_with_invalid_name(self):
        handler = mock.AsyncMock()
        self.app.meetings.end()(handler)
        self.assertEqual(len(self.app._routes), 1)

        await self.app.on_turn(
            TurnContext(
                SimpleAdapter(),
                Activity(
                    id="1234",
                    type="event",
                    text="test",
                    name="application/vnd.microsoft.meeting",
                    from_property=ChannelAccount(id="user", name="User Name"),
                    recipient=ChannelAccount(id="bot", name="Bot Name"),
                    conversation=ConversationAccount(id="convo", name="Convo Name"),
                    channel_id="msteams",
                    locale="en-uS",
                    service_url="https://example.org",
                    value={
                        "meetingType": "scheduled",
                        "startTime": "2020-10-01T00:00:00.000Z",
                        "endTime": "2020-10-01T00:30:00.000Z",
                    },
                ),
            )
        )

        handler.assert_not_called()

    @pytest.mark.asyncio
    async def test_end_with_wrong_type(self):
        handler = mock.AsyncMock()
        self.app.meetings.end()(handler)
        self.assertEqual(len(self.app._routes), 1)

        await self.app.on_turn(
            TurnContext(
                SimpleAdapter(),
                Activity(
                    id="1234",
                    type="invoke",
                    text="test",
                    name="application/vnd.microsoft.meetingEnd",
                    from_property=ChannelAccount(id="user", name="User Name"),
                    recipient=ChannelAccount(id="bot", name="Bot Name"),
                    conversation=ConversationAccount(id="convo", name="Convo Name"),
                    channel_id="msteams",
                    locale="en-uS",
                    service_url="https://example.org",
                    value={
                        "meetingType": "scheduled",
                        "startTime": "2020-10-01T00:00:00.000Z",
                        "endTime": "2020-10-01T00:30:00.000Z",
                    },
                ),
            )
        )

        handler.assert_not_called()

    @pytest.mark.asyncio
    async def test_end_with_wrong_channel(self):
        handler = mock.AsyncMock()
        self.app.meetings.end()(handler)
        self.assertEqual(len(self.app._routes), 1)

        await self.app.on_turn(
            TurnContext(
                SimpleAdapter(),
                Activity(
                    id="1234",
                    type="event",
                    text="test",
                    name="application/vnd.microsoft.meetingEnd",
                    from_property=ChannelAccount(id="user", name="User Name"),
                    recipient=ChannelAccount(id="bot", name="Bot Name"),
                    conversation=ConversationAccount(id="convo", name="Convo Name"),
                    channel_id="team",
                    locale="en-uS",
                    service_url="https://example.org",
                    value={
                        "meetingType": "scheduled",
                        "startTime": "2020-10-01T00:00:00.000Z",
                        "endTime": "2020-10-01T00:30:00.000Z",
                    },
                ),
            )
        )

        handler.assert_not_called()
