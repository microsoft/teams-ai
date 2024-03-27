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


class TestAdaptiveCards(IsolatedAsyncioTestCase):
    application: Application

    @pytest.fixture(autouse=True)
    def before_each(self):
        self.application = Application()
        yield

    @pytest.mark.asyncio
    async def test_fetch(self):
        handler = mock.AsyncMock()  # mock handler
        self.application.task_modules.fetch("CustomForm")(handler)
        self.assertEqual(len(self.application._routes), 1)

        # The handler will be tirggered
        await self.application.on_turn(
            TurnContext(
                SimpleAdapter(),
                self.mock_activity(
                    name="task/fetch",
                    value={
                        "data": {"type": "task/fetch", "verb": "CustomForm"},
                        "context": {"theme": "default"},
                    },
                ),
            )
        )

        # The handler will not be tirggered
        await self.application.on_turn(
            TurnContext(
                SimpleAdapter(),
                self.mock_activity(
                    name="task/fetch",
                    value={
                        "data": {"type": "task/fetch", "verb": "AnotherForm"},
                        "context": {"theme": "default"},
                    },
                ),
            )
        )

        handler.assert_called_once()

    def mock_activity(self, name, value):
        return Activity(
            id="1234",
            type="invoke",
            name=name,
            value=value,
            from_property=ChannelAccount(id="user", name="Task Modules Test User"),
            recipient=ChannelAccount(id="bot", name="Task Modules Test Bot"),
            conversation=ConversationAccount(id="convo", name="Task Modules Test Convo"),
            channel_id="UnitTest",
            locale="en-uS",
            service_url="https://example.org",
        )
