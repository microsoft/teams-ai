"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from typing import Any, cast
from unittest import IsolatedAsyncioTestCase, mock

from azure.core.exceptions import HttpResponseError
from botbuilder.core import TurnContext

from teams import ApplicationError
from teams.ai.actions import ActionTypes
from teams.ai.moderators import (
    AzureContentSafetyModerator,
    AzureContentSafetyModeratorOptions,
)
from teams.ai.planners import Plan, PredictedDoCommand, PredictedSayCommand
from teams.ai.prompts.message import Message
from teams.state import ConversationState, TempState, TurnState, UserState


class MockContentSafetyClient:
    def analyze_text(self, *_args, **_kwargs: Any):
        return {}


class MockContentSafetyClientWithResults:
    def analyze_text(self, *_args, **_kwargs: Any):
        return {
            "blocklistsMatchResults": [],
            "hateResult": {"category": "Hate", "severity": 6},
            "selfHarmResult": {"category": "SelfHarm", "severity": 0},
            "sexualResult": {"category": "Sexual", "severity": 0},
            "violenceResult": {"category": "Violence", "severity": 0},
        }


class MockContentSafetyClientWithError:
    def analyze_text(self, *_args, **_kwargs: Any):
        raise HttpResponseError("test")


class TestAzureContentSafetyModerator(IsolatedAsyncioTestCase):
    def create_mock_context(
        self, channel_id="channel1", bot_id="bot1", conversation_id="conversation1", user_id="user1"
    ):
        context = mock.MagicMock()
        context.activity.channel_id = channel_id
        context.activity.recipient.id = bot_id
        context.activity.conversation.id = conversation_id
        context.activity.from_property.id = user_id
        return context

    def test_should_raise_error_no_endpoint(self):
        with self.assertRaises(ApplicationError):
            AzureContentSafetyModerator(
                options=AzureContentSafetyModeratorOptions(api_key="", moderate="output")
            )

    @mock.patch(
        "azure.ai.contentsafety.ContentSafetyClient", return_value=MockContentSafetyClient()
    )
    async def test_should_not_review_input(self, mock_async_openai):
        moderator = AzureContentSafetyModerator(
            options=AzureContentSafetyModeratorOptions(api_key="", moderate="output", endpoint=""),
        )
        plan = await moderator.review_input(context=cast(TurnContext, {}), state=TurnState())
        self.assertTrue(mock_async_openai.called)
        self.assertIsNone(plan)

    @mock.patch(
        "azure.ai.contentsafety.ContentSafetyClient",
        return_value=MockContentSafetyClientWithResults(),
    )
    async def test_should_review_input_and_flag(self, mock_async_openai):
        moderator = AzureContentSafetyModerator(
            options=AzureContentSafetyModeratorOptions(api_key="", moderate="input", endpoint="")
        )
        context = self.create_mock_context()
        state = await TurnState[ConversationState, UserState, TempState].load(context)
        plan = await moderator.review_input(context=context, state=state)
        self.assertTrue(mock_async_openai.called)
        assert plan is not None
        self.assertEqual(len(plan.commands), 1)
        self.assertEqual(plan.commands[0].type, "DO")
        assert isinstance(plan.commands[0], PredictedDoCommand)
        self.assertEqual(plan.commands[0].action, ActionTypes.FLAGGED_INPUT)

    @mock.patch(
        "azure.ai.contentsafety.ContentSafetyClient",
        return_value=MockContentSafetyClientWithError(),
    )
    async def test_should_review_input_and_error(self, mock_async_openai):
        moderator = AzureContentSafetyModerator(
            options=AzureContentSafetyModeratorOptions(api_key="", moderate="both", endpoint="")
        )
        context = self.create_mock_context()
        state = await TurnState[ConversationState, UserState, TempState].load(context)
        plan = await moderator.review_input(context=context, state=state)
        self.assertTrue(mock_async_openai.called)
        assert plan is not None
        self.assertEqual(len(plan.commands), 1)
        self.assertEqual(plan.commands[0].type, "DO")
        assert isinstance(plan.commands[0], PredictedDoCommand)
        self.assertEqual(plan.commands[0].action, ActionTypes.HTTP_ERROR)

    @mock.patch(
        "azure.ai.contentsafety.ContentSafetyClient", return_value=MockContentSafetyClient()
    )
    async def test_should_not_review_output(self, mock_async_openai):
        moderator = AzureContentSafetyModerator(
            options=AzureContentSafetyModeratorOptions(api_key="", moderate="input", endpoint="")
        )
        plan = Plan(
            commands=[PredictedSayCommand(response=Message[str](role="assistant", content="test"))]
        )
        output = await moderator.review_output(
            context=cast(TurnContext, {}), state=TurnState(), plan=plan
        )
        self.assertTrue(mock_async_openai.called)
        self.assertEqual(plan, output)

    @mock.patch(
        "azure.ai.contentsafety.ContentSafetyClient",
        return_value=MockContentSafetyClientWithResults(),
    )
    async def test_should_review_output_and_flag(self, mock_async_openai):
        moderator = AzureContentSafetyModerator(
            options=AzureContentSafetyModeratorOptions(api_key="", moderate="output", endpoint="")
        )
        context = self.create_mock_context()
        state = await TurnState[ConversationState, UserState, TempState].load(context)
        plan = Plan(
            commands=[PredictedSayCommand(response=Message[str](role="assistant", content="test"))]
        )
        output = await moderator.review_output(context=context, state=state, plan=plan)
        self.assertTrue(mock_async_openai.called)
        assert output is not None
        self.assertEqual(len(output.commands), 1)
        self.assertEqual(output.commands[0].type, "DO")
        assert isinstance(output.commands[0], PredictedDoCommand)
        self.assertEqual(output.commands[0].action, ActionTypes.FLAGGED_OUTPUT)

    @mock.patch(
        "azure.ai.contentsafety.ContentSafetyClient",
        return_value=MockContentSafetyClientWithError(),
    )
    async def test_should_review_output_and_error(self, mock_async_openai):
        moderator = AzureContentSafetyModerator(
            options=AzureContentSafetyModeratorOptions(api_key="", moderate="both", endpoint="")
        )
        context = self.create_mock_context()
        state = await TurnState[ConversationState, UserState, TempState].load(context)
        plan = Plan(
            commands=[PredictedSayCommand(response=Message[str](role="assistant", content="test"))]
        )
        output = await moderator.review_output(context=context, state=state, plan=plan)
        self.assertTrue(mock_async_openai.called)
        assert output is not None
        self.assertEqual(len(output.commands), 1)
        self.assertEqual(output.commands[0].type, "DO")
        assert isinstance(output.commands[0], PredictedDoCommand)
        self.assertEqual(output.commands[0].action, ActionTypes.HTTP_ERROR)
