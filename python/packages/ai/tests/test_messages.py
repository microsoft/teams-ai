"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from unittest import IsolatedAsyncioTestCase, mock

import pytest
from botbuilder.core import TurnContext
from botbuilder.schema import Activity, ChannelAccount, ConversationAccount

from teams import Application
from tests.utils import SimpleAdapter


class TestMessages(IsolatedAsyncioTestCase):
    application: Application

    @pytest.fixture(autouse=True)
    def before_each(self):
        self.application = Application()
        yield

    @pytest.mark.asyncio
    async def test_fetch(self):
        handler = mock.AsyncMock()  # mock handler
        self.application.messages.fetch()(handler)
        self.assertEqual(len(self.application._routes), 1)

        # The handler will be tirggered
        await self.application.on_turn(
            TurnContext(
                SimpleAdapter(),
                Activity(
                    id="1234",
                    type="invoke",
                    name="message/fetchTask",
                    value={"hello": "world"},
                    from_property=ChannelAccount(id="user", name="Task Modules Test User"),
                    recipient=ChannelAccount(id="bot", name="Task Modules Test Bot"),
                    conversation=ConversationAccount(id="convo", name="Task Modules Test Convo"),
                    channel_id="UnitTest",
                    locale="en-uS",
                    service_url="https://example.org",
                ),
            )
        )
