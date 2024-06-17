"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from typing import List, Literal, Optional, Union, cast
from unittest import IsolatedAsyncioTestCase, mock

import httpx
import openai
from botbuilder.core import TurnContext

from teams.ai.actions import ActionTypes
from teams.ai.moderators import OpenAIModerator, OpenAIModeratorOptions
from teams.ai.planners import Plan, PredictedDoCommand, PredictedSayCommand
from teams.ai.prompts.message import Message
from teams.state import ConversationState, TempState, TurnState, UserState


class MockAsyncModerations:
    async def create(
        self,
        *,
        input: Union[str, List[str]],
        model: Union[
            str, Literal["text-moderation-latest", "text-moderation-stable"]
        ] = "text-moderation-latest",
        extra_headers: Optional[openai._types.Headers] = None,
        extra_query: Optional[openai._types.Query] = None,
        extra_body: Optional[openai._types.Body] = None,
        timeout: Union[
            float, httpx.Timeout, None, openai._types.NotGiven
        ] = openai._types.NOT_GIVEN,
    ) -> openai.types.ModerationCreateResponse:
        # pylint: disable=unused-argument
        return openai.types.ModerationCreateResponse(id="", model=model, results=[])


class MockAsyncModerationsWithResults:
    async def create(
        self,
        *,
        input: Union[str, List[str]],
        model: Union[
            str, Literal["text-moderation-latest", "text-moderation-stable"]
        ] = "text-moderation-latest",
        extra_headers: Optional[openai._types.Headers] = None,
        extra_query: Optional[openai._types.Query] = None,
        extra_body: Optional[openai._types.Body] = None,
        timeout: Union[
            float, httpx.Timeout, None, openai._types.NotGiven
        ] = openai._types.NOT_GIVEN,
    ) -> openai.types.ModerationCreateResponse:
        # pylint: disable=unused-argument
        return openai.types.ModerationCreateResponse(
            id="",
            model=model,
            results=[
                openai.types.Moderation(
                    categories=cast(
                        openai.types.moderation.Categories,
                        {
                            "harassment": True,
                            "harassment/threatening": False,
                            "hate": False,
                            "hate/threatening": False,
                            "self-harm": False,
                            "self-harm/instructions": False,
                            "self-harm/intent": False,
                            "sexual": False,
                            "sexual/minors": False,
                            "violence": False,
                            "violence/graphic": False,
                        },
                    ),
                    category_scores=cast(
                        openai.types.moderation.CategoryScores,
                        {
                            "harassment": 0,
                            "harassment/threatening": 0,
                            "hate": 0,
                            "hate/threatening": 0,
                            "self-harm": 0,
                            "self-harm/instructions": 0,
                            "self-harm/intent": 0,
                            "sexual": 0,
                            "sexual/minors": 0,
                            "violence": 0,
                            "violence/graphic": 0,
                        },
                    ),
                    flagged=True,
                )
            ],
        )


class MockAsyncModerationsRateLimited:
    async def create(
        self,
        *,
        input: Union[str, List[str]],
        model: Union[
            str, Literal["text-moderation-latest", "text-moderation-stable"]
        ] = "text-moderation-latest",
        extra_headers: Optional[openai._types.Headers] = None,
        extra_query: Optional[openai._types.Query] = None,
        extra_body: Optional[openai._types.Body] = None,
        timeout: Union[
            float, httpx.Timeout, None, openai._types.NotGiven
        ] = openai._types.NOT_GIVEN,
    ) -> openai.types.ModerationCreateResponse:
        # pylint: disable=unused-argument
        raise openai.RateLimitError(
            message="This is a rate limited error",
            response=httpx.Response(
                status_code=429, request=httpx.Request(method="method", url="url")
            ),
            body=None,
        )


class MockAsyncOpenAI:
    moderations = MockAsyncModerations()


class MockAsyncOpenAIWithResults:
    moderations = MockAsyncModerationsWithResults()


class MockAsyncOpenAIRateLimited:
    moderations = MockAsyncModerationsRateLimited()


class TestOpenAIModerator(IsolatedAsyncioTestCase):
    def create_mock_context(
        self, channel_id="channel1", bot_id="bot1", conversation_id="conversation1", user_id="user1"
    ):
        context = mock.MagicMock()
        context.activity.channel_id = channel_id
        context.activity.recipient.id = bot_id
        context.activity.conversation.id = conversation_id
        context.activity.from_property.id = user_id
        return context

    @mock.patch("openai.AsyncOpenAI", return_value=MockAsyncOpenAI)
    async def test_should_not_review_input(self, mock_async_openai):
        moderator = OpenAIModerator(options=OpenAIModeratorOptions(api_key="", moderate="output"))
        plan = await moderator.review_input(context=cast(TurnContext, {}), state=TurnState())
        self.assertTrue(mock_async_openai.called)
        self.assertIsNone(plan)

    @mock.patch("openai.AsyncOpenAI", return_value=MockAsyncOpenAIWithResults)
    async def test_should_review_input_and_flag(self, mock_async_openai):
        moderator = OpenAIModerator(options=OpenAIModeratorOptions(api_key="", moderate="input"))
        context = self.create_mock_context()
        state = await TurnState[ConversationState, UserState, TempState].load(context)
        plan = await moderator.review_input(context=context, state=state)
        self.assertTrue(mock_async_openai.called)
        assert plan is not None
        self.assertEqual(len(plan.commands), 1)
        self.assertEqual(plan.commands[0].type, "DO")
        assert isinstance(plan.commands[0], PredictedDoCommand)
        self.assertEqual(plan.commands[0].action, ActionTypes.FLAGGED_INPUT)

    @mock.patch("openai.AsyncOpenAI", return_value=MockAsyncOpenAIRateLimited)
    async def test_should_review_input_and_error(self, mock_async_openai):
        moderator = OpenAIModerator(options=OpenAIModeratorOptions(api_key="", moderate="both"))
        context = self.create_mock_context()
        state = await TurnState[ConversationState, UserState, TempState].load(context)
        plan = await moderator.review_input(context=context, state=state)
        self.assertTrue(mock_async_openai.called)
        assert plan is not None
        self.assertEqual(len(plan.commands), 1)
        self.assertEqual(plan.commands[0].type, "DO")
        assert isinstance(plan.commands[0], PredictedDoCommand)
        self.assertEqual(plan.commands[0].action, ActionTypes.HTTP_ERROR)

    @mock.patch("openai.AsyncOpenAI", return_value=MockAsyncOpenAI)
    async def test_should_not_review_output(self, mock_async_openai):
        moderator = OpenAIModerator(options=OpenAIModeratorOptions(api_key="", moderate="input"))
        plan = Plan(
            commands=[PredictedSayCommand(response=Message[str](role="assistant", content="test"))]
        )
        output = await moderator.review_output(
            context=cast(TurnContext, {}), state=TurnState(), plan=plan
        )
        self.assertTrue(mock_async_openai.called)
        self.assertEqual(plan, output)

    @mock.patch("openai.AsyncOpenAI", return_value=MockAsyncOpenAIWithResults)
    async def test_should_review_output_and_flag(self, mock_async_openai):
        moderator = OpenAIModerator(options=OpenAIModeratorOptions(api_key="", moderate="output"))
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

    @mock.patch("openai.AsyncOpenAI", return_value=MockAsyncOpenAIRateLimited)
    async def test_should_review_output_and_error(self, mock_async_openai):
        moderator = OpenAIModerator(options=OpenAIModeratorOptions(api_key="", moderate="both"))
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
