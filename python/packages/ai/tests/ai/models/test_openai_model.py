"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

import json
from typing import List, cast
from unittest import IsolatedAsyncioTestCase, mock

import httpx
import openai
from openai.types import chat
from openai.types.chat import (
    chat_completion_message_tool_call,
    chat_completion_message_tool_call_param,
)

from teams.ai.augmentations.monologue_augmentation import MonologueAugmentation
from teams.ai.augmentations.tools_augmentation import ToolsAugmentation
from teams.ai.augmentations.tools_constants import ACTIONS_HISTORY
from teams.ai.models import AzureOpenAIModelOptions, OpenAIModel, OpenAIModelOptions
from teams.ai.models.chat_completion_action import ChatCompletionAction
from teams.ai.prompts import (
    CompletionConfig,
    PromptFunctions,
    PromptTemplate,
    PromptTemplateConfig,
    TextSection,
)
from teams.ai.prompts.augmentation_config import AugmentationConfig
from teams.ai.prompts.message import ActionCall, ActionFunction
from teams.ai.tokenizers import GPTTokenizer
from teams.state import TurnState

chat_completion_tool_one = chat.ChatCompletionMessageToolCall(
    id="1",
    function=chat_completion_message_tool_call.Function(
        name="tool_one",
        arguments=json.dumps(
            {
                "arg_one": "hi",
                "arg_two": 3,
                "action_turn_context": None,
                "state": None,
            }
        ),
    ),
    type="function",
)
tool_call_one = chat.ChatCompletionMessageToolCallParam(
    id="1",
    function=chat_completion_message_tool_call_param.Function(
        name="tool_one",
        arguments=json.dumps(
            {
                "arg_one": "hi",
                "arg_two": 3,
                "action_turn_context": None,
                "state": None,
            }
        ),
    ),
    type="function",
)
action_call_one = ActionCall(
    id="1",
    type="function",
    function=ActionFunction(
        name="tool_one",
        arguments=json.dumps(
            {
                "arg_one": "hi",
                "arg_two": 3,
                "action_turn_context": None,
                "state": None,
            }
        ),
    ),
)
chat_completion_tool_two = chat.ChatCompletionMessageToolCall(
    id="2",
    function=chat_completion_message_tool_call.Function(
        name="tool_two",
        arguments=json.dumps(
            {
                "arg_one": "hi",
                "arg_two": "bye",
                "action_turn_context": None,
                "state": None,
            }
        ),
    ),
    type="function",
)
action_call_two = ActionCall(
    id="2",
    type="function",
    function=ActionFunction(
        name="tool_two",
        arguments=json.dumps(
            {
                "arg_one": "hi",
                "arg_two": "bye",
                "action_turn_context": None,
                "state": None,
            }
        ),
    ),
)


class MockAsyncCompletions:
    should_error = False
    has_tool_call = False
    has_tool_calls = False

    def __init__(self, should_error=False, has_tool_call=False, has_tool_calls=False) -> None:
        self.should_error = should_error
        self.has_tool_call = has_tool_call
        self.has_tool_calls = has_tool_calls

    async def create(self, **kwargs) -> chat.ChatCompletion:
        if self.should_error:
            raise openai.BadRequestError(
                "bad request",
                response=httpx.Response(400, request=httpx.Request(method="method", url="url")),
                body=None,
            )

        if self.has_tool_call:
            return await self.handle_tool_call(**kwargs)

        if self.has_tool_calls:
            return await self.handle_tool_calls(**kwargs)

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

    async def handle_tool_call(self, **kwargs) -> chat.ChatCompletion:
        return chat.ChatCompletion(
            id="",
            choices=[
                chat.chat_completion.Choice(
                    finish_reason="tool_calls",
                    index=0,
                    message=chat.ChatCompletionMessage(
                        content="test",
                        role="assistant",
                        tool_calls=[chat_completion_tool_one],
                    ),
                )
            ],
            created=0,
            model=kwargs["model"],
            object="chat.completion",
        )

    async def handle_tool_calls(self, **kwargs) -> chat.ChatCompletion:
        return chat.ChatCompletion(
            id="",
            choices=[
                chat.chat_completion.Choice(
                    finish_reason="tool_calls",
                    index=0,
                    message=chat.ChatCompletionMessage(
                        content="test",
                        role="assistant",
                        tool_calls=[chat_completion_tool_one, chat_completion_tool_two],
                    ),
                )
            ],
            created=0,
            model=kwargs["model"],
            object="chat.completion",
        )


class MockAsyncChat:
    completions: MockAsyncCompletions

    def __init__(self, should_error=False, has_tool_call=False, has_tool_calls=False) -> None:
        self.completions = MockAsyncCompletions(
            should_error=should_error,
            has_tool_call=has_tool_call,
            has_tool_calls=has_tool_calls,
        )


class MockAsyncOpenAIWithTool:
    chat = MockAsyncChat(has_tool_call=True)


class MockAsyncOpenAIWithTools:
    chat = MockAsyncChat(has_tool_calls=True)


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
        state.temp = {}
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
        state.temp = {}
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

    @mock.patch("openai.AsyncOpenAI", return_value=MockAsyncOpenAI)
    async def test_wrong_augmentation_type(self, mock_async_openai):
        context = self.create_mock_context()
        state = TurnState()
        state.temp = {}
        await state.load(context)

        model = OpenAIModel(OpenAIModelOptions(api_key="", default_model="model"))
        res = await model.complete_prompt(
            context=context,
            memory=state,
            functions=cast(PromptFunctions, {}),
            tokenizer=GPTTokenizer(),
            template=PromptTemplate(
                name="monologue",
                augmentation=MonologueAugmentation([]),
                prompt=TextSection(text="this is a test prompt", role="system", tokens=1),
                config=PromptTemplateConfig(
                    schema=1.0,
                    type="completion",
                    description="test",
                    augmentation=AugmentationConfig(augmentation_type="monologue"),
                    completion=CompletionConfig(completion_type="chat", parallel_tool_calls=True),
                ),
            ),
        )

        self.assertTrue(mock_async_openai.called)
        self.assertEqual(res.status, "success")
        if res.message:
            self.assertEqual(res.message.action_calls, None)

    @mock.patch("openai.AsyncOpenAI", return_value=MockAsyncOpenAI)
    async def test_include_tools_no_actions(self, mock_async_openai):
        context = self.create_mock_context()
        state = TurnState()
        state.temp = {}
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
                augmentation=ToolsAugmentation(),
                config=PromptTemplateConfig(
                    schema=1.0,
                    type="completion",
                    description="test",
                    augmentation=AugmentationConfig("tools"),
                    completion=CompletionConfig(completion_type="chat"),
                ),
            ),
        )

        self.assertTrue(mock_async_openai.called)
        self.assertEqual(res.status, "error")
        self.assertEqual(res.error, "Missing tools in template.actions")

    @mock.patch("openai.AsyncOpenAI", return_value=MockAsyncOpenAI)
    async def test_include_tools_empty_actions(self, mock_async_openai):
        context = self.create_mock_context()
        state = TurnState()
        state.temp = {}
        await state.load(context)

        model = OpenAIModel(OpenAIModelOptions(api_key="", default_model="model"))
        res = await model.complete_prompt(
            context=context,
            memory=state,
            functions=cast(PromptFunctions, {}),
            tokenizer=GPTTokenizer(),
            template=PromptTemplate(
                name="default",
                actions=[],
                prompt=TextSection(text="this is a test prompt", role="system", tokens=1),
                augmentation=ToolsAugmentation(),
                config=PromptTemplateConfig(
                    schema=1.0,
                    type="completion",
                    description="test",
                    augmentation=AugmentationConfig("tools"),
                    completion=CompletionConfig(completion_type="chat"),
                ),
            ),
        )

        self.assertTrue(mock_async_openai.called)
        self.assertEqual(res.status, "error")
        self.assertEqual(res.error, "Missing tools in template.actions")

    @mock.patch("openai.AsyncOpenAI", return_value=MockAsyncOpenAI)
    async def test_no_tools_called_with_optional_configurations(self, mock_async_openai):
        context = self.create_mock_context()
        state = TurnState()
        state.temp = {}
        actions = [
            ChatCompletionAction(name="tool_one", description="", parameters={}),
            ChatCompletionAction(name="tool_two", description="", parameters={}),
        ]
        await state.load(context)

        model = OpenAIModel(OpenAIModelOptions(api_key="", default_model="model"))
        res = await model.complete_prompt(
            context=context,
            memory=state,
            functions=cast(PromptFunctions, {}),
            tokenizer=GPTTokenizer(),
            template=PromptTemplate(
                augmentation=ToolsAugmentation(actions),
                name="default",
                prompt=TextSection(text="this is a test prompt", role="system", tokens=1),
                actions=actions,
                config=PromptTemplateConfig(
                    schema=1.0,
                    augmentation=AugmentationConfig("tools"),
                    type="completion",
                    description="test",
                    completion=CompletionConfig(
                        completion_type="chat",
                        tool_choice="auto",
                        parallel_tool_calls=True,
                    ),
                ),
            ),
        )

        self.assertTrue(mock_async_openai.called)
        self.assertEqual(res.status, "success")
        if res.message:
            self.assertEqual(res.message.action_calls, None)

    @mock.patch("openai.AsyncOpenAI", return_value=MockAsyncOpenAIWithTools)
    async def test_no_tools_called_with_no_parallel_calls(self, mock_async_openai):
        context = self.create_mock_context()
        state = TurnState()
        state.temp = {}
        actions = [
            ChatCompletionAction(name="tool_one", description="", parameters={}),
            ChatCompletionAction(name="tool_two", description="", parameters={}),
        ]
        await state.load(context)

        model = OpenAIModel(OpenAIModelOptions(api_key="", default_model="model"))
        res = await model.complete_prompt(
            context=context,
            memory=state,
            functions=cast(PromptFunctions, {}),
            tokenizer=GPTTokenizer(),
            template=PromptTemplate(
                name="default",
                augmentation=ToolsAugmentation(actions),
                prompt=TextSection(text="this is a test prompt", role="system", tokens=1),
                actions=actions,
                config=PromptTemplateConfig(
                    schema=1.0,
                    augmentation=AugmentationConfig("tools"),
                    type="completion",
                    description="test",
                    completion=CompletionConfig(completion_type="chat", parallel_tool_calls=False),
                ),
            ),
        )

        self.assertTrue(mock_async_openai.called)
        self.assertEqual(res.status, "error")
        self.assertEqual(res.error, "Model returned more than one tool.")

    @mock.patch("openai.AsyncOpenAI", return_value=MockAsyncOpenAIWithTools)
    async def test_no_tools_called_with_dict_tool_choice(self, mock_async_openai):
        context = self.create_mock_context()
        state = TurnState()
        state.temp = {}
        actions = [
            ChatCompletionAction(name="tool_one", description="", parameters={}),
            ChatCompletionAction(name="tool_two", description="", parameters={}),
        ]
        await state.load(context)

        model = OpenAIModel(OpenAIModelOptions(api_key="", default_model="model"))
        res = await model.complete_prompt(
            context=context,
            memory=state,
            functions=cast(PromptFunctions, {}),
            tokenizer=GPTTokenizer(),
            template=PromptTemplate(
                name="default",
                augmentation=ToolsAugmentation(actions),
                prompt=TextSection(text="this is a test prompt", role="system", tokens=1),
                actions=actions,
                config=PromptTemplateConfig(
                    schema=1.0,
                    augmentation=AugmentationConfig("tools"),
                    type="completion",
                    description="test",
                    completion=CompletionConfig(
                        completion_type="chat",
                        tool_choice={"type": "function", "function": {"name": "tool_one"}},
                    ),
                ),
            ),
        )

        self.assertTrue(mock_async_openai.called)
        self.assertEqual(res.status, "error")
        self.assertEqual(res.error, "Model returned more than one tool.")

    @mock.patch("openai.AsyncOpenAI", return_value=MockAsyncOpenAI)
    async def test_no_tools_called_with_required_tool_choice(self, mock_async_openai):
        context = self.create_mock_context()
        state = TurnState()
        state.temp = {}
        actions = [
            ChatCompletionAction(name="tool_one", description="", parameters={}),
            ChatCompletionAction(name="tool_two", description="", parameters={}),
        ]
        await state.load(context)

        model = OpenAIModel(OpenAIModelOptions(api_key="", default_model="model"))
        res = await model.complete_prompt(
            context=context,
            memory=state,
            functions=cast(PromptFunctions, {}),
            tokenizer=GPTTokenizer(),
            template=PromptTemplate(
                name="default",
                augmentation=ToolsAugmentation(actions),
                prompt=TextSection(text="this is a test prompt", role="system", tokens=1),
                actions=actions,
                config=PromptTemplateConfig(
                    schema=1.0,
                    augmentation=AugmentationConfig("tools"),
                    type="completion",
                    description="test",
                    completion=CompletionConfig(completion_type="chat", tool_choice="required"),
                ),
            ),
        )

        self.assertTrue(mock_async_openai.called)
        self.assertEqual(res.status, "error")
        self.assertEqual(res.error, "Model did not return any tools")

    @mock.patch("openai.AsyncOpenAI", return_value=MockAsyncOpenAIWithTool)
    async def test_no_tools_called_with_tool_choice_none(self, mock_async_openai):
        context = self.create_mock_context()
        state = TurnState()
        state.temp = {}
        actions = [
            ChatCompletionAction(name="tool_one", description="", parameters={}),
            ChatCompletionAction(name="tool_two", description="", parameters={}),
        ]
        await state.load(context)

        model = OpenAIModel(OpenAIModelOptions(api_key="", default_model="model"))
        res = await model.complete_prompt(
            context=context,
            memory=state,
            functions=cast(PromptFunctions, {}),
            tokenizer=GPTTokenizer(),
            template=PromptTemplate(
                name="default",
                augmentation=ToolsAugmentation(actions),
                prompt=TextSection(text="this is a test prompt", role="system", tokens=1),
                actions=actions,
                config=PromptTemplateConfig(
                    schema=1.0,
                    augmentation=AugmentationConfig("tools"),
                    type="completion",
                    description="test",
                    completion=CompletionConfig(completion_type="chat", tool_choice="none"),
                ),
            ),
        )

        self.assertTrue(mock_async_openai.called)
        self.assertEqual(res.status, "error")
        self.assertEqual(res.error, "Model returned tools.")

    @mock.patch("openai.AsyncOpenAI", return_value=MockAsyncOpenAIWithTool)
    async def test_one_tool_called(self, mock_async_openai_with_tool):
        context = self.create_mock_context()
        state = TurnState()
        state.temp = {}
        state.conversation = {}
        actions = [
            ChatCompletionAction(name="tool_one", description="", parameters={}),
            ChatCompletionAction(name="tool_two"),
        ]
        await state.load(context)

        model = OpenAIModel(OpenAIModelOptions(api_key="", default_model="model"))
        res = await model.complete_prompt(
            context=context,
            memory=state,
            functions=cast(PromptFunctions, {}),
            tokenizer=GPTTokenizer(),
            template=PromptTemplate(
                name="default",
                augmentation=ToolsAugmentation(actions),
                prompt=TextSection(text="this is a test prompt", role="system", tokens=1),
                actions=actions,
                config=PromptTemplateConfig(
                    schema=1.0,
                    type="completion",
                    description="test",
                    augmentation=AugmentationConfig("tools"),
                    completion=CompletionConfig(completion_type="chat"),
                ),
            ),
        )

        self.assertTrue(mock_async_openai_with_tool.called)
        self.assertEqual(res.status, "success")
        if res.message:
            self.assertEqual(
                res.message.action_calls,
                [action_call_one],
            )

        tool_messages = cast(List[chat.ChatCompletionMessageParam], state.get(ACTIONS_HISTORY))

        curr_tool_message = cast(chat.ChatCompletionAssistantMessageParam, tool_messages[1])
        self.assertEqual(curr_tool_message.tool_calls[0].id, "1")  # type: ignore[attr-defined]

    @mock.patch("openai.AsyncOpenAI", return_value=MockAsyncOpenAIWithTools)
    async def test_two_tools_called(self, mock_async_openai_with_tools):
        context = self.create_mock_context()
        state = TurnState()
        state.temp = {}
        state.conversation = {}
        actions = [
            ChatCompletionAction(name="tool_one", description="", parameters={}),
            ChatCompletionAction(name="tool_two"),
        ]
        await state.load(context)

        model = OpenAIModel(OpenAIModelOptions(api_key="", default_model="model"))
        res = await model.complete_prompt(
            context=context,
            memory=state,
            functions=cast(PromptFunctions, {}),
            tokenizer=GPTTokenizer(),
            template=PromptTemplate(
                name="default",
                augmentation=ToolsAugmentation(actions),
                prompt=TextSection(text="this is a test prompt", role="system", tokens=1),
                actions=actions,
                config=PromptTemplateConfig(
                    schema=1.0,
                    type="completion",
                    description="test",
                    augmentation=AugmentationConfig("tools"),
                    completion=CompletionConfig(completion_type="chat", tool_choice="required"),
                ),
            ),
        )

        self.assertTrue(mock_async_openai_with_tools.called)
        self.assertEqual(res.status, "success")
        if res.message:
            self.assertEqual(res.message.action_calls, [action_call_one, action_call_two])

        tool_messages = cast(List[chat.ChatCompletionMessageParam], state.get(ACTIONS_HISTORY))
        curr_tool_message = cast(chat.ChatCompletionAssistantMessageParam, tool_messages[1])
        self.assertEqual(curr_tool_message.tool_calls[0].id, "1")  # type: ignore[attr-defined]
        self.assertEqual(curr_tool_message.tool_calls[1].id, "2")  # type: ignore[attr-defined]

    @mock.patch("openai.AsyncOpenAI", return_value=MockAsyncOpenAI)
    async def test_round_trip_call(self, mock_async_openai):
        context = self.create_mock_context()
        state = TurnState()
        state.temp = {}
        state.conversation = {}
        state.set(
            ACTIONS_HISTORY,
            [
                chat.ChatCompletionAssistantMessageParam(
                    role="assistant", tool_calls=[tool_call_one]
                ),
                chat.ChatCompletionToolMessageParam(tool_call_id="1", role="tool", content=""),
            ],
        )

        actions = [
            ChatCompletionAction(name="tool_one", description="", parameters={}),
            ChatCompletionAction(name="tool_two"),
        ]
        await state.load(context)

        model = OpenAIModel(OpenAIModelOptions(api_key="", default_model="model"))
        res = await model.complete_prompt(
            context=context,
            memory=state,
            functions=cast(PromptFunctions, {}),
            tokenizer=GPTTokenizer(),
            template=PromptTemplate(
                name="default",
                augmentation=ToolsAugmentation(actions),
                prompt=TextSection(text="this is a test prompt", role="system", tokens=1),
                actions=actions,
                config=PromptTemplateConfig(
                    schema=1.0,
                    type="completion",
                    description="test",
                    augmentation=AugmentationConfig("tools"),
                    completion=CompletionConfig(completion_type="chat"),
                ),
            ),
        )

        self.assertTrue(mock_async_openai.called)
        self.assertEqual(res.status, "success")
        if res.message:
            self.assertEqual(res.message.action_calls, None)
        tool_history = cast(List[chat.ChatCompletionMessageParam], state.get(ACTIONS_HISTORY))
        self.assertEqual(len(tool_history), 0)
