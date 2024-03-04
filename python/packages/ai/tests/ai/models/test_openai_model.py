"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from typing import cast
from unittest import IsolatedAsyncioTestCase, mock

import httpx
import openai
from openai.types import chat

from teams.ai.models import AzureOpenAIModelOptions, OpenAIModel, OpenAIModelOptions
from teams.ai.prompts import (
    CompletionConfig,
    PromptFunctions,
    PromptTemplate,
    PromptTemplateConfig,
    TextSection,
)
from teams.ai.tokenizers import GPTTokenizer
from teams.state import TurnState


class MockAsyncCompletions:
    should_error = False

    def __init__(self, should_error=False) -> None:
        self.should_error = should_error

    async def create(self, **kwargs) -> chat.ChatCompletion:
        if self.should_error:
            raise openai.BadRequestError(
                "bad request",
                response=httpx.Response(400, request=httpx.Request(method="method", url="url")),
                body=None,
            )

        return chat.ChatCompletion(
            id="",
            choices=[
                chat.chat_completion.Choice(
                    finish_reason="stop",
                    index=0,
                    message=chat.ChatCompletionMessage(content="test", role="assistant"),
                )
            ],
            created=0,
            model=kwargs["model"],
            object="chat.completion",
        )


class MockAsyncChat:
    completions: MockAsyncCompletions

    def __init__(self, should_error=False) -> None:
        self.completions = MockAsyncCompletions(should_error=should_error)


class MockAsyncOpenAI:
    chat = MockAsyncChat()


class MockAsyncAzureOpenAI:
    chat = MockAsyncChat()


class MockAsyncOpenAIError:
    chat = MockAsyncChat(should_error=True)


class TestOpenAIModel(IsolatedAsyncioTestCase):
    def create_mock_context(
        self, channel_id="channel1", bot_id="bot1", conversation_id="conversation1", user_id="user1"
    ):
        context = mock.MagicMock()
        context.activity.channel_id = channel_id
        context.activity.recipient.id = bot_id
        context.activity.conversation.id = conversation_id
        context.activity.from_property.id = user_id
        return context

    @mock.patch("openai.AsyncOpenAI", spec=MockAsyncOpenAI)
    async def test_should_be_openai(self, mock_async_openai):
        model = OpenAIModel(OpenAIModelOptions(api_key="", default_model="model"))
        self.assertTrue(mock_async_openai.called)
        self.assertTrue(isinstance(model._client, MockAsyncOpenAI))

    @mock.patch("openai.AsyncAzureOpenAI", spec=MockAsyncAzureOpenAI)
    async def test_should_be_azure_openai(self, mock_async_openai):
        model = OpenAIModel(AzureOpenAIModelOptions(api_key="", default_model="model", endpoint=""))
        self.assertTrue(mock_async_openai.called)
        self.assertTrue(isinstance(model._client, MockAsyncAzureOpenAI))

    @mock.patch("openai.AsyncOpenAI", return_value=MockAsyncOpenAIError)
    async def test_should_raise_error(self, mock_async_openai):
        context = self.create_mock_context()
        state = TurnState()
        await state.load(context)

        model = OpenAIModel(OpenAIModelOptions(api_key="", default_model="model"))
        res = await model.complete_prompt(
            context=context,
            memory=state,
            functions=cast(PromptFunctions, {}),
            tokenizer=GPTTokenizer(),
            template=PromptTemplate(
                name="default",
                prompt=TextSection(text="this is a test prompt", role="system", tokens=1),
                config=PromptTemplateConfig(
                    schema=1.0,
                    type="completion",
                    description="test",
                    completion=CompletionConfig(completion_type="chat"),
                ),
            ),
        )

        self.assertTrue(mock_async_openai.called)
        self.assertEqual(res.status, "error")

    @mock.patch("openai.AsyncOpenAI", return_value=MockAsyncOpenAI)
    async def test_should_be_success(self, mock_async_openai):
        context = self.create_mock_context()
        state = TurnState()
        await state.load(context)

        model = OpenAIModel(OpenAIModelOptions(api_key="", default_model="model"))
        res = await model.complete_prompt(
            context=context,
            memory=state,
            functions=cast(PromptFunctions, {}),
            tokenizer=GPTTokenizer(),
            template=PromptTemplate(
                name="default",
                prompt=TextSection(text="this is a test prompt", role="system", tokens=1),
                config=PromptTemplateConfig(
                    schema=1.0,
                    type="completion",
                    description="test",
                    completion=CompletionConfig(completion_type="chat"),
                ),
            ),
        )

        self.assertTrue(mock_async_openai.called)
        self.assertEqual(res.status, "success")
