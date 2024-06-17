"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from dataclasses import dataclass
from datetime import datetime
from typing import Dict, Iterable, List, Literal, Optional, Union, cast
from unittest import IsolatedAsyncioTestCase, mock

import httpx
import openai
from botbuilder.core import TurnContext
from dataclasses_json import DataClassJsonMixin, dataclass_json
from openai._base_client import AsyncPaginator
from openai.pagination import AsyncCursorPage
from openai.types import beta
from openai.types.beta import AssistantTool, Thread
from openai.types.beta.threads import (
    Message,
    RequiredActionFunctionToolCall,
    Run,
    Text,
    TextContentBlock,
    required_action_function_tool_call,
    run,
    run_submit_tool_outputs_params,
)

from teams.ai.actions.action_types import ActionTypes
from teams.ai.planners.assistants_planner import (
    AssistantsPlanner,
    OpenAIAssistantsOptions,
)
from teams.ai.planners.plan import PredictedDoCommand, PredictedSayCommand
from teams.app_error import ApplicationError
from teams.state import TurnState
from teams.state.conversation_state import ConversationState
from teams.state.temp_state import TempState
from teams.state.user_state import UserState

ASSISTANT_ID = "assistant_id"
ASSISTANT_MODEL = "test model"
ASSISTANT_INSTRUCTIONS = "instructions"
ASSISTANT_TOOLS: List[AssistantTool] = []

RunStatuses = Literal[
    "queued",
    "in_progress",
    "requires_action",
    "cancelling",
    "cancelled",
    "failed",
    "completed",
    "expired",
]


@dataclass_json
@dataclass
class MockAsyncPaginator(DataClassJsonMixin):
    data: Union[List[Run], List[Message]]
    first_id: str
    last_id: str
    has_more: bool


class MockAsyncRuns:
    _threads: List[Thread]
    _messages: Dict[str, List[Message]]
    _runs: Dict[str, List[Run]]
    remaining_actions: List[run.RequiredAction]
    remaining_run_status: List[RunStatuses]
    remaining_messages: List[str]

    def __init__(
        self,
        shared_threads: List[Thread],
        shared_messages: Dict[str, List[Message]],
        shared_runs: Dict[str, List[Run]],
        remaining_actions: List[run.RequiredAction],
        remaining_run_status: List[RunStatuses],
        remaining_messages: List[str],
    ) -> None:
        self._threads = shared_threads
        self._messages = shared_messages
        self._runs = shared_runs
        self.remaining_actions = remaining_actions
        self.remaining_run_status = remaining_run_status
        self.remaining_messages = remaining_messages

    async def retrieve(
        self,
        run_id: str,
        *,
        thread_id: str,
        extra_headers: Optional[openai._types.Headers] = None,
        extra_query: Optional[openai._types.Query] = None,
        extra_body: Optional[openai._types.Body] = None,
        timeout: Union[
            float, httpx.Timeout, None, openai._types.NotGiven
        ] = openai._types.NOT_GIVEN,
    ) -> Run:
        # pylint: disable=unused-argument

        if len(self._runs[thread_id]) == 0:
            raise ValueError("no more runs left")

        run_status = self.remaining_run_status.pop(0)
        index = -1

        for runs in self._runs[thread_id]:
            index += 1
            if runs.id == run_id:
                break
            if index == (len(self._runs[thread_id]) - 1):
                index = -1
                break

        curr_run = self._runs[thread_id][index]
        curr_run.status = run_status
        return curr_run

    async def submit_tool_outputs(
        self,
        run_id: str,
        *,
        thread_id: str,
        tool_outputs: Iterable[run_submit_tool_outputs_params.ToolOutput],
        extra_headers: Optional[openai._types.Headers] = None,
        extra_query: Optional[openai._types.Query] = None,
        extra_body: Optional[openai._types.Body] = None,
        timeout: Union[
            float, httpx.Timeout, None, openai._types.NotGiven
        ] = openai._types.NOT_GIVEN,
    ) -> Run:
        # pylint: disable=unused-argument
        return await self.retrieve(thread_id=thread_id, run_id=run_id)

    async def create(
        self,
        thread_id: str,
        *,
        assistant_id: str,
        additional_instructions: Union[
            Optional[str], openai._types.NotGiven
        ] = openai._types.NOT_GIVEN,
        instructions: Union[Optional[str], openai._types.NotGiven] = openai._types.NOT_GIVEN,
        metadata: Union[Optional[object], openai._types.NotGiven] = openai._types.NOT_GIVEN,
        model: Union[Optional[str], openai._types.NotGiven] = openai._types.NOT_GIVEN,
        tools: Union[
            Optional[Iterable[AssistantTool]], openai._types.NotGiven
        ] = openai._types.NOT_GIVEN,
        extra_headers: Optional[openai._types.Headers] = None,
        extra_query: Optional[openai._types.Query] = None,
        extra_body: Optional[openai._types.Body] = None,
        timeout: Union[
            float, httpx.Timeout, None, openai._types.NotGiven
        ] = openai._types.NOT_GIVEN,
    ) -> Run:
        # pylint: disable=unused-argument
        remaining_actions: Optional[run.RequiredAction] = None

        if len(self.remaining_actions) > 0:
            remaining_actions = self.remaining_actions.pop(0)

        new_run = Run(
            id=str(datetime.now()),
            thread_id=thread_id,
            assistant_id=assistant_id,
            status="in_progress",
            required_action=remaining_actions if remaining_actions else None,
            model=ASSISTANT_MODEL if ASSISTANT_MODEL else "test-model",
            instructions=ASSISTANT_INSTRUCTIONS if ASSISTANT_INSTRUCTIONS else "instructions",
            tools=ASSISTANT_TOOLS if ASSISTANT_TOOLS else [],
            created_at=235312,
            expires_at=2317312,
            started_at=2312812,
            completed_at=61312321,
            cancelled_at=5312321,
            failed_at=31712312,
            object="thread.run",
        )

        if thread_id in self._runs:
            self._runs[thread_id].append(new_run)
        else:
            self._runs[thread_id] = [new_run]

        return new_run

    async def list(
        self,
        thread_id: str,
        *,
        after: Union[str, openai._types.NotGiven] = openai._types.NOT_GIVEN,
        before: Union[str, openai._types.NotGiven] = openai._types.NOT_GIVEN,
        limit: Union[int, openai._types.NotGiven],
        order: Union[Literal["asc", "desc"], openai._types.NotGiven] = openai._types.NOT_GIVEN,
        extra_headers: Optional[openai._types.Headers] = None,
        extra_query: Optional[openai._types.Query] = None,
        extra_body: Optional[openai._types.Body] = None,
        timeout: Union[
            float, httpx.Timeout, None, openai._types.NotGiven
        ] = openai._types.NOT_GIVEN,
    ) -> AsyncPaginator[Run, AsyncCursorPage[Run]]:
        # pylint: disable=unused-argument
        runs = self._runs[thread_id] if thread_id in self._runs else []

        result = MockAsyncPaginator(data=runs, first_id="", last_id="", has_more=False)
        return cast(AsyncPaginator, result)


class MockAsyncMessages:
    _threads: List[Thread]
    _messages: Dict[str, List[Message]]
    _runs: Dict[str, List[Run]]
    remaining_actions: List[run.RequiredAction]
    remaining_run_status: List[RunStatuses]
    remaining_messages: List[str]

    def __init__(
        self,
        shared_threads: List[Thread],
        shared_messages: Dict[str, List[Message]],
        shared_runs: Dict[str, List[Run]],
        remaining_actions: List[run.RequiredAction],
        remaining_run_status: List[RunStatuses],
        remaining_messages: List[str],
    ) -> None:
        self._threads = shared_threads
        self._messages = shared_messages
        self._runs = shared_runs
        self.remaining_actions = remaining_actions
        self.remaining_run_status = remaining_run_status
        self.remaining_messages = remaining_messages

    async def create(
        self,
        thread_id: str,
        *,
        content: str,
        role: Literal["user"],
        file_ids: Union[List[str], openai._types.NotGiven] = openai._types.NOT_GIVEN,
        metadata: Union[Optional[object], openai._types.NotGiven] = openai._types.NOT_GIVEN,
        extra_headers: Optional[openai._types.Headers] = None,
        extra_query: Optional[openai._types.Query] = None,
        extra_body: Optional[openai._types.Body] = None,
        timeout: Union[
            float, httpx.Timeout, None, openai._types.NotGiven
        ] = openai._types.NOT_GIVEN,
    ) -> Message:
        # pylint: disable=unused-argument
        new_message = Message(
            id=str(datetime.now()),
            status="completed",
            created_at=123,
            thread_id=thread_id,
            role=role,
            content=[TextContentBlock(type="text", text=Text(annotations=[], value=content))],
            assistant_id=ASSISTANT_ID,
            object="thread.message",
        )

        if thread_id in self._messages:
            self._messages[thread_id].append(new_message)
        else:
            self._messages[thread_id] = [new_message]
        return new_message

    async def list(
        self,
        thread_id: str,
        *,
        after: Union[str, openai._types.NotGiven] = openai._types.NOT_GIVEN,
        before: Union[str, openai._types.NotGiven] = openai._types.NOT_GIVEN,
        limit: Union[int, openai._types.NotGiven] = openai._types.NOT_GIVEN,
        order: Union[Literal["asc", "desc"], openai._types.NotGiven] = openai._types.NOT_GIVEN,
        extra_headers: Optional[openai._types.Headers] = None,
        extra_query: Optional[openai._types.Query] = None,
        extra_body: Optional[openai._types.Body] = None,
        timeout: Union[
            float, httpx.Timeout, None, openai._types.NotGiven
        ] = openai._types.NOT_GIVEN,
    ) -> AsyncPaginator[Message, AsyncCursorPage[Message]]:
        # pylint: disable=unused-argument
        while len(self.remaining_messages) > 0:
            next_message = self.remaining_messages.pop(0)
            await self.create(
                thread_id=thread_id, role="user", content=next_message, file_ids=[], metadata=None
            )

        last_message_id = before
        index = -1

        for threads in self._messages[thread_id]:
            index += 1
            if threads.id == last_message_id:
                break
            if index == (len(self._messages[thread_id]) - 1):
                index = -1
                break

        filtered_messages = self._messages[thread_id][index + 1 :]

        filtered_messages.reverse()

        result = MockAsyncPaginator(data=filtered_messages, first_id="", last_id="", has_more=False)

        return cast(AsyncPaginator, result)


class MockAsyncAssistants:
    _threads: List[Thread]
    _messages: Dict[str, List[Message]]
    _runs: Dict[str, List[Run]]
    remaining_actions: List[run.RequiredAction]
    remaining_run_status: List[RunStatuses]
    remaining_messages: List[str]

    def __init__(
        self,
        shared_threads: List[Thread],
        shared_messages: Dict[str, List[Message]],
        shared_runs: Dict[str, List[Run]],
        remaining_actions: List[run.RequiredAction],
        remaining_run_status: List[RunStatuses],
        remaining_messages: List[str],
    ) -> None:
        self._threads = shared_threads
        self._messages = shared_messages
        self._runs = shared_runs
        self.remaining_actions = remaining_actions
        self.remaining_run_status = remaining_run_status
        self.remaining_messages = remaining_messages

    async def create(
        self,
        *,
        model: str,
        description: Union[Optional[str], openai._types.NotGiven] = "",
        file_ids: Union[List[str], openai._types.NotGiven] = [],
        instructions: Union[Optional[str], openai._types.NotGiven] = None,
        metadata: Union[Optional[object], openai._types.NotGiven] = openai._types.NotGiven,
        name: Union[Optional[str], openai._types.NotGiven] = "",
        tools: Union[Iterable[AssistantTool], openai._types.NotGiven] = openai._types.NOT_GIVEN,
        extra_headers: Optional[openai._types.Headers] = None,
        extra_query: Optional[openai._types.Query] = None,
        extra_body: Optional[openai._types.Body] = None,
        timeout: Union[
            float, httpx.Timeout, None, openai._types.NotGiven
        ] = openai._types.NOT_GIVEN,
    ) -> beta.Assistant:
        # pylint: disable=unused-argument
        # pylint: disable=dangerous-default-value
        return beta.Assistant(
            id=ASSISTANT_ID,
            created_at=3232,
            instructions=ASSISTANT_INSTRUCTIONS,
            model=ASSISTANT_MODEL,
            object="assistant",
            tools=[],
        )


class MockAsyncThreads:
    runs: MockAsyncRuns
    messages: MockAsyncMessages
    _threads: List[Thread]
    _messages: Dict[str, List[Message]]
    _runs: Dict[str, List[Run]]
    remaining_actions: List[run.RequiredAction]
    remaining_run_status: List[RunStatuses]
    remaining_messages: List[str]

    def __init__(
        self,
        shared_threads: List[Thread],
        shared_messages: Dict[str, List[Message]],
        shared_runs: Dict[str, List[Run]],
        remaining_actions: List[run.RequiredAction],
        remaining_run_status: List[RunStatuses],
        remaining_messages: List[str],
    ) -> None:
        self._threads = shared_threads
        self._messages = shared_messages
        self._runs = shared_runs
        self.remaining_actions = remaining_actions
        self.remaining_run_status = remaining_run_status
        self.remaining_messages = remaining_messages

        self.runs = MockAsyncRuns(
            shared_threads=self._threads,
            shared_messages=self._messages,
            shared_runs=self._runs,
            remaining_actions=self.remaining_actions,
            remaining_run_status=self.remaining_run_status,
            remaining_messages=self.remaining_messages,
        )
        self.messages = MockAsyncMessages(
            shared_threads=self._threads,
            shared_messages=self._messages,
            shared_runs=self._runs,
            remaining_actions=self.remaining_actions,
            remaining_run_status=self.remaining_run_status,
            remaining_messages=self.remaining_messages,
        )

    async def create(
        self,
        *,
        messages: Union[
            Iterable[beta.thread_create_params.Message], openai._types.NotGiven
        ] = openai._types.NOT_GIVEN,
        metadata: Union[Optional[object], openai._types.NotGiven] = openai._types.NOT_GIVEN,
        extra_headers: Optional[openai._types.Headers] = None,
        extra_query: Optional[openai._types.Query] = None,
        extra_body: Optional[openai._types.Body] = None,
        timeout: Union[
            float, httpx.Timeout, None, openai._types.NotGiven
        ] = openai._types.NOT_GIVEN,
    ) -> Thread:
        # pylint: disable=unused-argument
        new_thread = Thread(
            id=str(datetime.now()),
            created_at=2312312,
            metadata=metadata if metadata else None,
            object="thread",
        )
        new_messages: List[Message] = []

        if isinstance(messages, Iterable):
            for message in messages:
                new_message = Message(
                    role=message["role"],
                    id=str(datetime.now()),
                    status="completed",
                    created_at=23123,
                    thread_id=new_thread.id,
                    assistant_id=ASSISTANT_ID,
                    content=[
                        TextContentBlock(
                            type="text",
                            text=Text(annotations=[], value=cast(str, message["content"])),
                        )
                    ],
                    object="thread.message",
                )
                new_messages.append(new_message)

        self._messages[new_thread.id] = new_messages
        self._threads.append(new_thread)
        return new_thread


class MockAsyncBeta:
    _threads: List[Thread]
    _messages: Dict[str, List[Message]]
    _runs: Dict[str, List[Run]]
    remaining_actions: List[run.RequiredAction]
    remaining_run_status: List[RunStatuses]
    remaining_messages: List[str]
    assistants: MockAsyncAssistants
    threads: MockAsyncThreads

    def __init__(
        self,
        shared_threads: List[Thread],
        shared_messages: Dict[str, List[Message]],
        shared_runs: Dict[str, List[Run]],
        remaining_actions: List[run.RequiredAction],
        remaining_run_status: List[RunStatuses],
        remaining_messages: List[str],
    ) -> None:
        self._threads = shared_threads
        self._messages = shared_messages
        self._runs = shared_runs
        self.remaining_actions = remaining_actions
        self.remaining_run_status = remaining_run_status
        self.remaining_messages = remaining_messages
        self.assistants = MockAsyncAssistants(
            shared_threads=self._threads,
            shared_messages=self._messages,
            shared_runs=self._runs,
            remaining_actions=self.remaining_actions,
            remaining_run_status=self.remaining_run_status,
            remaining_messages=self.remaining_messages,
        )
        self.threads = MockAsyncThreads(
            shared_threads=self._threads,
            shared_messages=self._messages,
            shared_runs=self._runs,
            remaining_actions=self.remaining_actions,
            remaining_run_status=self.remaining_run_status,
            remaining_messages=self.remaining_messages,
        )


class MockAsyncOpenAI:
    beta: MockAsyncBeta
    _threads: List[Thread]
    _messages: Dict[str, List[Message]]
    _runs: Dict[str, List[Run]]
    remaining_actions: List[run.RequiredAction]
    remaining_run_status: List[RunStatuses]
    remaining_messages: List[str]

    def __init__(
        self,
        shared_threads: List[Thread] = [],
        shared_messages: Dict[str, List[Message]] = {},
        shared_runs: Dict[str, List[Run]] = {},
        remaining_actions: List[run.RequiredAction] = [],
        remaining_run_status: List[RunStatuses] = [],
        remaining_messages: List[str] = [],
    ) -> None:
        # pylint: disable=dangerous-default-value
        self._threads = shared_threads
        self._messages = shared_messages
        self._runs = shared_runs
        self.remaining_actions = remaining_actions
        self.remaining_run_status = remaining_run_status
        self.remaining_messages = remaining_messages

        self.beta = MockAsyncBeta(
            self._threads,
            self._messages,
            self._runs,
            remaining_actions,
            remaining_run_status,
            remaining_messages,
        )


class TestAssistantsPlanner(IsolatedAsyncioTestCase):
    def create_mock_context(
        self, channel_id="channel1", bot_id="bot1", conversation_id="conversation1", user_id="user1"
    ):
        context = mock.MagicMock()
        context.activity.channel_id = channel_id
        context.activity.recipient.id = bot_id
        context.activity.conversation.id = conversation_id
        context.activity.from_property.id = user_id
        return context

    async def create_state(
        self, context: TurnContext
    ) -> TurnState[ConversationState, UserState, TempState]:
        state = await TurnState[ConversationState, UserState, TempState].load(context)
        state.temp.input = ""
        state.temp.input_files = []
        state.temp.last_output = ""
        state.temp.action_outputs = {}
        state.temp.auth_tokens = {}
        return state

    @mock.patch("openai.AsyncOpenAI", return_value=MockAsyncOpenAI())
    async def test_create_openai_assistant(self, mock_async_openai):
        params = beta.AssistantCreateParams(model="123")

        assistant = await AssistantsPlanner.create_assistant(
            api_key="", api_version="", organization="", endpoint="", request=params
        )

        self.assertTrue(mock_async_openai.called)
        self.assertEqual(assistant.id, ASSISTANT_ID)
        self.assertEqual(assistant.model, ASSISTANT_MODEL)

    @mock.patch("openai.AsyncAzureOpenAI", return_value=MockAsyncOpenAI())
    async def test_create_azure_openai_assistant(self, mock_async_azure_openai):
        params = beta.AssistantCreateParams(model="123")

        assistant = await AssistantsPlanner.create_assistant(
            api_key="",
            api_version="",
            organization="",
            endpoint="this is my endpoint",
            request=params,
        )

        self.assertTrue(mock_async_azure_openai.called)
        self.assertEqual(assistant.id, ASSISTANT_ID)
        self.assertEqual(assistant.model, ASSISTANT_MODEL)

    @mock.patch(
        "openai.AsyncOpenAI",
        return_value=MockAsyncOpenAI(
            remaining_run_status=["completed"], remaining_messages=["welcome"]
        ),
    )
    async def test_begin_task_single_reply(self, mock_async_openai):
        context = self.create_mock_context()
        state = await self.create_state(context)
        state.temp.input = "hello"

        assistants_planner = AssistantsPlanner(
            OpenAIAssistantsOptions(
                api_key="test-key",
                assistant_id=ASSISTANT_ID,
            )
        )

        plan = await assistants_planner.begin_task(context, state)

        self.assertTrue(mock_async_openai.called)
        self.assertNotEqual(plan, None)
        self.assertEqual(len(plan.commands), 1)
        self.assertEqual(plan.commands[0].type, "SAY")
        commands = cast(List[PredictedSayCommand], plan.commands)
        if commands[0].response is not None:
            self.assertEqual("welcome", commands[0].response.content)
        else:
            self.fail("commands[0].response is None")

    @mock.patch(
        "openai.AsyncOpenAI",
        return_value=MockAsyncOpenAI(
            remaining_run_status=["in_progress", "completed"], remaining_messages=["welcome"]
        ),
    )
    async def test_begin_task_waits_for_run(self, mock_async_openai):
        context = self.create_mock_context()
        state = await self.create_state(context)
        state.temp.input = "hello"

        assistants_planner = AssistantsPlanner(
            OpenAIAssistantsOptions(
                api_key="test-key",
                assistant_id=ASSISTANT_ID,
            )
        )

        plan = await assistants_planner.begin_task(context, state)

        self.assertTrue(mock_async_openai.called)
        self.assertNotEqual(plan, None)
        self.assertEqual(len(plan.commands), 1)
        self.assertEqual(plan.commands[0].type, "SAY")
        commands = cast(List[PredictedSayCommand], plan.commands)
        assert commands[0].response is not None
        self.assertEqual("welcome", commands[0].response.content)

    @mock.patch(
        "openai.AsyncOpenAI",
        return_value=MockAsyncOpenAI(
            shared_messages={"123": []},
            shared_threads=[Thread(id="123", created_at=12323, object="thread")],
            shared_runs={
                "123": [
                    Run(
                        id="234",
                        thread_id="123",
                        assistant_id=ASSISTANT_ID,
                        status="in_progress",
                        created_at=233,
                        expires_at=23123,
                        instructions=ASSISTANT_INSTRUCTIONS,
                        model=ASSISTANT_MODEL,
                        object="thread.run",
                        tools=ASSISTANT_TOOLS,
                    )
                ]
            },
            remaining_run_status=["failed", "completed"],
            remaining_messages=["welcome"],
        ),
    )
    async def test_begin_task_waits_for_previous_run(self, mock_async_openai):
        context = self.create_mock_context()
        state = await self.create_state(context)
        state.temp.input = "hello"

        assistants_planner = AssistantsPlanner(
            OpenAIAssistantsOptions(
                api_key="test-key",
                assistant_id=ASSISTANT_ID,
            )
        )

        state.set("conversation.assistants_state", {"thread_id": "123"})

        plan = await assistants_planner.begin_task(context, state)

        self.assertTrue(mock_async_openai.called)
        self.assertNotEqual(plan, None)
        self.assertEqual(len(plan.commands), 1)
        self.assertEqual(plan.commands[0].type, "SAY")
        commands = cast(List[PredictedSayCommand], plan.commands)
        assert commands[0].response is not None
        self.assertEqual("welcome", commands[0].response.content)

    @mock.patch(
        "openai.AsyncOpenAI",
        return_value=MockAsyncOpenAI(
            remaining_run_status=["cancelled"], remaining_messages=["welcome"]
        ),
    )
    async def test_begin_task_run_cancelled(self, mock_async_openai):
        context = self.create_mock_context()
        state = await self.create_state(context)
        state.temp.input = "hello"

        assistants_planner = AssistantsPlanner(
            OpenAIAssistantsOptions(
                api_key="test-key",
                assistant_id=ASSISTANT_ID,
            )
        )

        plan = await assistants_planner.begin_task(context, state)

        self.assertTrue(mock_async_openai.called)
        self.assertNotEqual(plan, None)
        self.assertEqual(len(plan.commands), 0)

    @mock.patch(
        "openai.AsyncOpenAI",
        return_value=MockAsyncOpenAI(
            remaining_run_status=["expired"], remaining_messages=["welcome"]
        ),
    )
    async def test_begin_task_run_expired(self, mock_async_openai):
        context = self.create_mock_context()
        state = await self.create_state(context)
        state.temp.input = "hello"

        assistants_planner = AssistantsPlanner(
            OpenAIAssistantsOptions(
                api_key="test-key",
                assistant_id=ASSISTANT_ID,
            )
        )

        plan = await assistants_planner.begin_task(context, state)

        self.assertTrue(mock_async_openai.called)
        self.assertNotEqual(plan, None)
        self.assertEqual(len(plan.commands), 1)
        self.assertEqual(plan.commands[0].type, "DO")
        self.assertEqual(
            ActionTypes.TOO_MANY_STEPS, cast(PredictedDoCommand, plan.commands[0]).action
        )

    @mock.patch(
        "openai.AsyncOpenAI",
        return_value=MockAsyncOpenAI(
            remaining_run_status=["failed"], remaining_messages=["welcome"]
        ),
    )
    async def test_begin_task_run_failed(self, mock_async_openai):
        context = self.create_mock_context()
        state = await self.create_state(context)
        state.temp.input = "hello"

        assistants_planner = AssistantsPlanner(
            OpenAIAssistantsOptions(
                api_key="test-key",
                assistant_id=ASSISTANT_ID,
            )
        )

        self.assertTrue(mock_async_openai.called)

        with self.assertRaises(ApplicationError):
            await assistants_planner.begin_task(context, state)

    @mock.patch(
        "openai.AsyncOpenAI",
        return_value=MockAsyncOpenAI(
            remaining_actions=[
                run.RequiredAction(
                    type="submit_tool_outputs",
                    submit_tool_outputs=run.RequiredActionSubmitToolOutputs(
                        tool_calls=[
                            RequiredActionFunctionToolCall(
                                type="function",
                                id="test-tool-id",
                                function=required_action_function_tool_call.Function(
                                    arguments="{}", name="test-action"
                                ),
                            )
                        ]
                    ),
                )
            ],
            remaining_run_status=["requires_action", "in_progress", "completed"],
            remaining_messages=["welcome"],
        ),
    )
    async def test_continue_task_requires_action(self, mock_async_openai):
        context = self.create_mock_context()
        state = await self.create_state(context)
        state.temp.input = "hello"

        assistants_planner = AssistantsPlanner(
            OpenAIAssistantsOptions(
                api_key="test-key",
                assistant_id=ASSISTANT_ID,
            )
        )

        plan1 = await assistants_planner.continue_task(context, state)
        state.temp.action_outputs["test-action"] = "test-output"
        plan2 = await assistants_planner.continue_task(context, state)
        commands1 = cast(List[PredictedDoCommand], plan1.commands)
        commands2 = cast(List[PredictedSayCommand], plan2.commands)

        self.assertTrue(mock_async_openai.called)
        self.assertNotEqual(plan1, None)
        self.assertEqual(len(plan1.commands), 1)
        self.assertEqual(plan1.commands[0].type, "DO")
        if commands1[0].action is not None:
            self.assertEqual("test-action", commands1[0].action)
        else:
            self.fail("commands1[0].action is None")

        self.assertNotEqual(plan2, None)
        self.assertEqual(len(plan2.commands), 1)
        self.assertEqual(plan2.commands[0].type, "SAY")
        if commands2[0].response is not None:
            self.assertEqual("welcome", commands2[0].response.content)
        else:
            self.fail("commands2[0].response is None")

        tool_map = state.get("temp.submit_tool_map")
        if tool_map:
            self.assertTrue("test-action" in tool_map)
            self.assertEqual(tool_map["test-action"], "test-tool-id")

    @mock.patch(
        "openai.AsyncOpenAI",
        return_value=MockAsyncOpenAI(
            remaining_actions=[
                run.RequiredAction(
                    type="submit_tool_outputs",
                    submit_tool_outputs=run.RequiredActionSubmitToolOutputs(
                        tool_calls=[
                            RequiredActionFunctionToolCall(
                                type="function",
                                id="test-tool-id",
                                function=required_action_function_tool_call.Function(
                                    arguments="{}", name="test-action"
                                ),
                            )
                        ]
                    ),
                )
            ],
            remaining_run_status=["requires_action", "in_progress", "completed"],
            remaining_messages=["welcome"],
        ),
    )
    async def test_continue_task_ignores_redundant_action(self, mock_async_openai):
        context = self.create_mock_context()
        state = await self.create_state(context)
        state.temp.input = "hello"
        state.temp.action_outputs["other-action"] = "should not be used"

        assistants_planner = AssistantsPlanner(
            OpenAIAssistantsOptions(
                api_key="test-key",
                assistant_id=ASSISTANT_ID,
            )
        )

        plan1 = await assistants_planner.continue_task(context, state)
        state.temp.action_outputs["test-action"] = "test-output"
        plan2 = await assistants_planner.continue_task(context, state)

        self.assertTrue(mock_async_openai.called)
        self.assertNotEqual(plan1, None)
        self.assertEqual(len(plan1.commands), 1)
        self.assertEqual(plan1.commands[0].type, "DO")
        self.assertEqual("test-action", cast(PredictedDoCommand, plan1.commands[0]).action)

        self.assertNotEqual(plan2, None)
        self.assertEqual(len(plan2.commands), 1)
        self.assertEqual(plan2.commands[0].type, "SAY")
        commands = cast(List[PredictedSayCommand], plan2.commands)
        assert commands[0].response is not None
        self.assertEqual("welcome", commands[0].response.content)

        tool_map = state.get("temp.submit_tool_map")
        if tool_map:
            self.assertTrue("test-action" in tool_map)
            self.assertEqual(tool_map["test-action"], "test-tool-id")

    @mock.patch(
        "openai.AsyncOpenAI",
        return_value=MockAsyncOpenAI(
            remaining_run_status=["completed"],
            remaining_messages=["message 2", "message 1", "welcome"],
        ),
    )
    async def test_continue_task_multiple_messages(self, mock_async_openai):
        context = self.create_mock_context()
        state = await self.create_state(context)
        state.temp.input = "hello"
        state.temp.action_outputs["other-action"] = "should not be used"

        assistants_planner = AssistantsPlanner(
            OpenAIAssistantsOptions(
                api_key="test-key",
                assistant_id=ASSISTANT_ID,
            )
        )

        plan = await assistants_planner.continue_task(context, state)
        commands = cast(List[PredictedSayCommand], plan.commands)

        self.assertTrue(mock_async_openai.called)
        self.assertNotEqual(plan, None)
        self.assertEqual(len(commands), 3)

        self.assertEqual(commands[0].type, "SAY")
        assert commands[0].response is not None
        self.assertEqual("message 2", commands[0].response.content)

        assert commands[1].type == "SAY"
        assert commands[1].response is not None
        self.assertEqual("message 1", commands[1].response.content)

        assert commands[2].type == "SAY"
        assert commands[2].response is not None
        self.assertEqual("welcome", commands[2].response.content)
