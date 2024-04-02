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


class TestAdaptiveCardss(IsolatedAsyncioTestCase):
    app: Application

    @pytest.fixture(autouse=True)
    def before_each(self):
        self.app = Application()
        yield

    @pytest.mark.asyncio
    async def test_action_execute(self):
        handler = mock.AsyncMock()
        self.app.adaptive_cards.action_execute("doStuff")(handler)
        self.assertEqual(len(self.app._routes), 1)

        # This should trigger the handler
        await self.app.on_turn(
            TurnContext(
                SimpleAdapter(),
                self.mock_activity(
                    type="invoke",
                    name="adaptiveCard/action",
                    value={
                        "action": {
                            "type": "Action.Execute",
                            "title": "Action.Execute",
                            "isEnabled": False,
                            "data": {"x": 123},
                            "verb": "doStuff",
                        },
                        "trigger": "manual",
                    },
                ),
            )
        )

        # This should not trigger the handler
        await self.app.on_turn(
            TurnContext(
                SimpleAdapter(),
                self.mock_activity(
                    type="invoke",
                    name="adaptiveCard/action",
                    value={
                        "action": {
                            "type": "Action.Execute",
                            "title": "Action.Execute",
                            "isEnabled": False,
                            "data": {"x": 123},
                            "verb": "anotherVerb",
                        },
                        "trigger": "manual",
                    },
                ),
            )
        )

        handler.assert_called_once()

    @pytest.mark.asyncio
    async def test_action_submit(self):
        handler = mock.AsyncMock()
        self.app.adaptive_cards.action_submit("StaticSubmit")(handler)
        self.assertEqual(len(self.app._routes), 1)

        # This should trigger the handler
        await self.app.on_turn(
            TurnContext(
                SimpleAdapter(),
                self.mock_activity(
                    type="message",
                    value={"verb": "StaticSubmit", "choiceSelect": "visual_studio"},
                    name=None,
                ),
            )
        )

        # This should not trigger the handler
        await self.app.on_turn(
            TurnContext(
                SimpleAdapter(),
                self.mock_activity(
                    type="message",
                    value={"verb": "DynamicSubmit", "choiceSelect": "visual_studio"},
                    name=None,
                ),
            )
        )

        handler.assert_called_once()

    @pytest.mark.asyncio
    async def test_search(self):
        handler = mock.AsyncMock()
        self.app.adaptive_cards.search("npmpackages")(handler)
        self.assertEqual(len(self.app._routes), 1)

        # This should trigger the handler
        await self.app.on_turn(
            TurnContext(
                SimpleAdapter(),
                self.mock_activity(
                    type="invoke",
                    name="application/search",
                    value={
                        "queryText": "test",
                        "queryOptions": {"skip": 0, "top": 15},
                        "dataset": "npmpackages",
                    },
                ),
            )
        )

        # This should not trigger the handler
        await self.app.on_turn(
            TurnContext(
                SimpleAdapter(),
                self.mock_activity(
                    type="invoke",
                    name="application/search",
                    value={
                        "queryText": "test",
                        "queryOptions": {"skip": 0, "top": 15},
                        "dataset": "nugetpackages",
                    },
                ),
            )
        )

        handler.assert_called_once()

    def mock_activity(self, type, value, name):
        return Activity(
            id="1234",
            type=type,
            name=name,
            value=value,
            from_property=ChannelAccount(id="user", name="Test User"),
            recipient=ChannelAccount(id="bot", name="Test Bot"),
            conversation=ConversationAccount(id="convo", name="Test Convo"),
            channel_id="UnitTest",
            locale="en-uS",
            service_url="https://example.org",
        )
