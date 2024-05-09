"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from asyncio import Future
from unittest import IsolatedAsyncioTestCase
from unittest.mock import MagicMock

from teams import Application, ApplicationOptions
from teams.auth import AuthOptions, OAuth, OAuthOptions
from teams.state import TurnState


class TestAuthManager(IsolatedAsyncioTestCase):
    app: Application[TurnState]

    def setUp(self):
        self.app = Application[TurnState](
            ApplicationOptions(
                auth=AuthOptions(
                    default="a",
                    settings={
                        "a": OAuthOptions(title="a", connection_name="a"),
                        "b": OAuthOptions(title="b", connection_name="b"),
                    },
                ),
            )
        )

    def create_mock_context(
        self, channel_id="channel1", bot_id="bot1", conversation_id="conversation1", user_id="user1"
    ):
        context = MagicMock()
        context.activity.channel_id = channel_id
        context.activity.recipient.id = bot_id
        context.activity.conversation.id = conversation_id
        context.activity.from_property.id = user_id
        return context

    async def test_app_init(self):
        self.assertEqual(len(self.app.auth._connections), 2)
        self.assertTrue(isinstance(self.app.auth.get("a"), OAuth))

    async def test_sign_in_pending(self):
        context = self.create_mock_context()
        state = await TurnState.load(context)
        auth = MagicMock()
        return_value = Future()
        return_value.set_result(None)
        auth.get_token = MagicMock(return_value=return_value)
        auth.sign_in = MagicMock(return_value=return_value)
        self.app.auth.set("a", auth)
        res = await self.app.auth.sign_in(context, state)
        self.assertTrue(auth.sign_in.called)
        self.assertTrue(res.status == "pending")

    async def test_sign_in_complete(self):
        context = self.create_mock_context()
        state = await TurnState.load(context)
        auth = MagicMock()
        token_return_value = Future()
        token_return_value.set_result(None)
        sign_in_return_value = Future()
        sign_in_return_value.set_result("test")
        auth.get_token = MagicMock(return_value=token_return_value)
        auth.sign_in = MagicMock(return_value=sign_in_return_value)
        auth._on_sign_in_success = None
        self.app.auth.set("a", auth)
        res = await self.app.auth.sign_in(context, state)
        self.assertTrue(auth.sign_in.called)
        self.assertTrue(res.status == "complete")
