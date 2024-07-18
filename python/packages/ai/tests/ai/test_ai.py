"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from unittest import IsolatedAsyncioTestCase
from unittest.mock import AsyncMock

from botbuilder.core import TurnContext
from botbuilder.schema import Activity, ChannelAccount, ConversationAccount

from teams.ai.ai import AI, AIOptions, ApplicationError
from teams.ai.planners.planner import Planner
from teams.state import TurnState
from tests.utils import SimpleAdapter


class TestAI(IsolatedAsyncioTestCase):
    def setUp(self):
        mock_planner = AsyncMock(spec=Planner)
        options = AIOptions(
            planner=mock_planner,
        )
        self.ai = AI(options)

    def create_mock_context(self):
        return TurnContext(
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

    def create_mock_state(self):
        state = TurnState()
        return state

    async def test_do_action_existing_action(self):
        context = self.create_mock_context()
        state = self.create_mock_state()

        mock_handler = AsyncMock(return_value="action result")

        self.ai.action(name="test_action")(mock_handler)

        result = await self.ai.do_action(context, state, "test_action")
        self.assertEqual(result, "action result")

        await mock_handler.wait_called()  # Ensure the mock handler is called

        if mock_handler.await_args is not None:
            called_context, called_state = mock_handler.await_args.args
            self.assertEqual(called_context.name, "test_action")
            self.assertEqual(called_context.data, None)
            self.assertEqual(called_context._activity, context.activity)
            self.assertEqual(called_context.adapter, context.adapter)
            self.assertEqual(called_state, state)

    async def test_do_action_non_existing_action(self):
        context = self.create_mock_context()
        state = self.create_mock_state()

        with self.assertRaises(ApplicationError):
            await self.ai.do_action(context, state, "non_existing_action")

    async def test_do_action_with_parameters(self):
        context = self.create_mock_context()
        state = self.create_mock_state()

        mock_handler = AsyncMock(return_value="action result")

        self.ai.action(name="test_action")(mock_handler)

        parameters = {"param1": "value1"}
        result = await self.ai.do_action(context, state, "test_action", parameters)
        self.assertEqual(result, "action result")

        await mock_handler.wait_called()  # Ensure the mock handler is called

        if mock_handler.await_args is not None:
            called_context, called_state = mock_handler.await_args.args
            self.assertEqual(called_context.name, "test_action")
            self.assertEqual(called_context.data, parameters)
            self.assertEqual(called_context._activity, context.activity)
            self.assertEqual(called_context.adapter, context.adapter)
            self.assertEqual(called_state, state)
