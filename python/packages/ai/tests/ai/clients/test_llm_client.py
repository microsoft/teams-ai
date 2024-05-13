"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from typing import cast
from unittest import IsolatedAsyncioTestCase, mock

import httpx
import openai
from openai.types import chat

from teams.ai.clients.llm_client import LLMClient, LLMClientOptions
from teams.ai.models.openai_model import OpenAIModel, OpenAIModelOptions
from teams.ai.models.prompt_response import PromptResponse
from teams.ai.prompts import Message
from teams.ai.prompts.completion_config import CompletionConfig
from teams.ai.prompts.prompt_functions import PromptFunctions
from teams.ai.prompts.prompt_template import PromptTemplate
from teams.ai.prompts.prompt_template_config import PromptTemplateConfig
from teams.ai.prompts.sections.text_section import TextSection
from teams.ai.tokenizers.gpt_tokenizer import GPTTokenizer
from teams.state import TurnState
from teams.state.conversation_state import ConversationState
from teams.state.temp_state import TempState
from teams.state.user_state import UserState


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


class MockAsyncOpenAIError:
    chat = MockAsyncChat(should_error=True)


class TestLLMClient(IsolatedAsyncioTestCase):
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
    async def test_add_function_result_object(self, mock_async_openai):
        context = self.create_mock_context()
        state = await TurnState[ConversationState, UserState, TempState].load(context)

        model = OpenAIModel(OpenAIModelOptions(api_key="", default_model="model"))
        client = LLMClient(LLMClientOptions(model))
        client.add_function_result_to_history(memory=state, name="name", results="results")

        expected_history = [Message(role="function", name="name", content='"results"')]

        self.assertTrue(mock_async_openai.called)
        self.assertEqual(state.get(client.options.history_variable), expected_history)

    @mock.patch("openai.AsyncOpenAI", return_value=MockAsyncOpenAI)
    async def test_add_function_result_bool(self, mock_async_openai):
        context = self.create_mock_context()
        state = await TurnState[ConversationState, UserState, TempState].load(context)

        model = OpenAIModel(OpenAIModelOptions(api_key="", default_model="model"))
        client = LLMClient(LLMClientOptions(model))
        client.add_function_result_to_history(memory=state, name="name", results=True)

        expected_history = [Message(role="function", name="name", content="true")]

        self.assertTrue(mock_async_openai.called)
        self.assertEqual(state.get(client.options.history_variable), expected_history)

    @mock.patch("openai.AsyncOpenAI", return_value=MockAsyncOpenAI)
    async def test_complete_prompt_no_attempts(self, mock_async_openai):
        context = self.create_mock_context()
        state = await TurnState[ConversationState, UserState, TempState].load(context)

        model = OpenAIModel(OpenAIModelOptions(api_key="", default_model="model"))
        client = LLMClient(LLMClientOptions(model))
        response = await client.complete_prompt(
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
            remaining_attempts=-2,
        )

        expected_response = PromptResponse(
            status="invalid_response", error="Reached max model response repair attempts."
        )

        self.assertTrue(mock_async_openai.called)
        self.assertEqual(response, expected_response)

    @mock.patch("openai.AsyncOpenAI", return_value=MockAsyncOpenAIError)
    async def test_complete_prompt_unsuccessful(self, mock_async_openai):
        context = self.create_mock_context()
        state = await TurnState[ConversationState, UserState, TempState].load(context)

        model = OpenAIModel(OpenAIModelOptions(api_key="", default_model="model"))
        client = LLMClient(LLMClientOptions(model))
        response = await client.complete_prompt(
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
        self.assertEqual(response.status, "error")

    @mock.patch("openai.AsyncOpenAI", return_value=MockAsyncOpenAI)
    async def test_complete_prompt_with_value(self, mock_async_openai):
        context = self.create_mock_context()
        state = await TurnState[ConversationState, UserState, TempState].load(context)

        model = OpenAIModel(OpenAIModelOptions(api_key="", default_model="model"))
        client = LLMClient(LLMClientOptions(model))
        response = await client.complete_prompt(
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
            remaining_attempts=2,
        )

        expected_history = [
            Message(role="user", content=""),
            Message(role="assistant", content="test"),
        ]

        self.assertTrue(mock_async_openai.called)

        if response.message is not None:
            self.assertEqual(response.message.content, "test")

        self.assertEqual(state.get(client.options.history_variable), expected_history)
