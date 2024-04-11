"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from __future__ import annotations

import asyncio
import json
from dataclasses import dataclass
from typing import Dict, Generic, List, Optional, TypeVar

import openai
from botbuilder.core import TurnContext
from dataclasses_json import DataClassJsonMixin, dataclass_json
from openai.types.beta.assistant import Assistant
from openai.types.beta.assistant_create_params import AssistantCreateParams
from openai.types.beta.threads import Run
from openai.types.beta.threads.run import RequiredAction
from openai.types.beta.threads.run_submit_tool_outputs_params import ToolOutput

from ...app_error import ApplicationError
from ...state import TurnState
from ...user_agent import _UserAgent
from ..actions.action_types import ActionTypes
from .plan import Plan, PredictedDoCommand, PredictedSayCommand
from .planner import Planner

DEFAULT_POLLING_INTERVAL = 1
DEFAULT_ASSISTANTS_STATE_VARIABLE = "conversation.assistants_state"
SUBMIT_TOOL_OUTPUTS_VARIABLE = "temp.submit_tool_outputs"
SUBMIT_TOOL_OUTPUTS_MAP = "temp.submit_tool_map"

StateT = TypeVar("StateT", bound=TurnState)


@dataclass_json
@dataclass
class AssistantsState(DataClassJsonMixin):
    thread_id: Optional[str] = ""
    run_id: Optional[str] = ""
    last_message_id: Optional[str] = ""


@dataclass
class AssistantsPlannerOptions:
    """
    Options for configuring the AssistantsPlanner.
    """

    api_key: str
    "The OpenAI API key."

    assistant_id: str
    "The ID of the assistant to use."

    polling_interval: float = DEFAULT_POLLING_INTERVAL
    "Optional. Polling interval in seconds. Defaults to 1 second"

    assistants_state_variable: str = DEFAULT_ASSISTANTS_STATE_VARIABLE
    "Optional. The state variable to use for storing the assistants state."

    organization: Optional[str] = None
    "Optional organization."

    endpoint: Optional[str] = None
    "Optional endpoint."


class AssistantsPlanner(Generic[StateT], _UserAgent, Planner[StateT]):
    "A planner that uses the OpenAI Assistants API."

    _options: AssistantsPlannerOptions
    _client: openai.AsyncOpenAI

    @property
    def options(self) -> AssistantsPlannerOptions:
        return self._options

    @property
    def client(self) -> openai.AsyncOpenAI:
        return self._client

    def __init__(
        self, options: AssistantsPlannerOptions, client: Optional[openai.AsyncOpenAI] = None
    ) -> None:
        """
        Creates a new `AssistantsPlanner` instance.

        Args:
            options (AssistantsPlannerOptions): Options used to configure the planner.
            client (Optional[openai.AsyncOpenAI]): The OpenAI client.

        """

        self._options = options
        self._client = (
            client
            if client is not None
            else openai.AsyncOpenAI(
                api_key=options.api_key,
                organization=options.organization,
                default_headers={"User-Agent": self.user_agent},
                base_url=options.endpoint,
            )
        )

    async def begin_task(self, context: TurnContext, state: TurnState) -> Plan:
        """
        Starts a new task.
        This method is called when the AI system is ready to start a new task. The planner should
        generate a plan that the AI system will execute. Returning an empty plan signals that
        there is no work to be performed. The planner should take the users input
        from `state.temp.input`.

        Args:
            context (TurnContext): Context for the current turn of conversation.
            state (TurnState): Application state for the current turn of conversation.

        Returns:
            Plan: The plan that was generated.
        """
        return await self.continue_task(context, state)

    async def continue_task(self, context: TurnContext, state: TurnState) -> Plan:
        """
        This method is called when the AI system has finished executing the previous plan and is
        ready to continue the current task. The planner should generate a plan
        that the AI system will execute. Returning an empty plan signals that the task is
        completed and there is no work to be performed.
        The output from the last plan step that was executed is passed to the planner
        via `state.temp.input`.

        Args:
            context (TurnContext): Context for the current turn of conversation.
            state (TurnState): Application state for the current turn of conversation.

        Returns:
            Plan: The plan that was generated.
        """

        # Create a new thread id if we don't have one already
        thread_id = await self._ensure_thread_created(state)

        # Add the users input to the thread or send tool outputs
        if state.get(SUBMIT_TOOL_OUTPUTS_VARIABLE) is True:
            # Send the tool output to the assistant
            return await self._submit_action_results(state)

        # Wait for any current runs to complete since you can'tadd messages
        # or start new runs if there's already one in progress
        await self._block_on_in_progress_runs(thread_id)

        # Submit user input
        return await self._submit_user_input(state)

    @staticmethod
    async def create_assistant(
        api_key: str,
        organization: Optional[str],
        endpoint: Optional[str],
        request: AssistantCreateParams,
    ) -> Assistant:
        """
        Static method for programmatically creating an assistant.

        Args:
            api_key (str): The OpenAI API key.
            organization (Optional[str]): The optional organization.
            endpoint: (Optional[str]): The optional endpoint.
            request: (AssistantCreateParams): The parameters used to create the assistant.

        Returns:
            Assistant: The assistant.
        """
        openai_client = openai.AsyncOpenAI(
            api_key=api_key,
            organization=organization if organization else None,
            base_url=endpoint if endpoint else None,
        )

        return await openai_client.beta.assistants.create(
            model=request.get("model", ""),
            description=request.get("description"),
            file_ids=request.get("file_ids", []),
            instructions=request.get("instructions"),
            metadata=request.get("metadata"),
            name=request.get("name"),
            tools=request.get("tools", []),
        )

    async def _ensure_thread_created(self, state: TurnState) -> str:
        assistants_state = self._ensure_assistants_state(state)
        if not assistants_state.thread_id:
            thread = await self._client.beta.threads.create()
            assistants_state.thread_id = thread.id
            state.set(self._options.assistants_state_variable, assistants_state)

        return assistants_state.thread_id

    def _ensure_assistants_state(self, state: TurnState) -> AssistantsState:
        if not state.has(self._options.assistants_state_variable):
            state.set(self._options.assistants_state_variable, AssistantsState())

        assitants_state = state.get(self._options.assistants_state_variable)
        return AssistantsState.from_dict(assitants_state)

    async def _submit_action_results(self, state: TurnState) -> Plan:
        # Get the current assistant state
        assistants_state = self._ensure_assistants_state(state)

        # Map the action outputs to tool outputs
        action_outputs = state.temp.action_outputs
        tool_map = state.get(SUBMIT_TOOL_OUTPUTS_MAP)
        tool_outputs: List[ToolOutput] = []

        for action in action_outputs:
            output = action_outputs[action]
            if tool_map:
                tool_call_id = tool_map[action]
                if tool_call_id is not None:
                    # Add required output only
                    tool_outputs.append(ToolOutput(tool_call_id=tool_call_id, output=output))

        # Submit the tool outputs
        if assistants_state.thread_id and assistants_state.run_id:
            run = await self._client.beta.threads.runs.submit_tool_outputs(
                run_id=assistants_state.run_id,
                thread_id=assistants_state.thread_id,
                tool_outputs=tool_outputs,
            )

            # Wait for the run to complete
            results = await self._wait_for_run(assistants_state.thread_id, run.id, True)
            if results is not None:
                if results.status == "requires_action" and results.required_action:
                    state.set(SUBMIT_TOOL_OUTPUTS_VARIABLE, True)
                    return self._generate_plan_from_tools(state, results.required_action)
                if results.status == "completed" and assistants_state.last_message_id:
                    state.set(SUBMIT_TOOL_OUTPUTS_VARIABLE, False)
                    return await self._generate_plan_from_messages(
                        assistants_state.thread_id, assistants_state.last_message_id
                    )
                if results.status == "cancelled":
                    return Plan()
                if results.status == "expired":
                    return Plan(commands=[PredictedDoCommand(action=ActionTypes.TOO_MANY_STEPS)])

                if results.last_error:
                    raise ApplicationError(
                        f"Run failed {results.status}. ErrorCode: "
                        + f"{results.last_error.code}. ErrorMessage: {results.last_error.message}"
                    )
        return Plan()

    async def _wait_for_run(
        self, thread_id: str, run_id: str, handle_actions: bool = False
    ) -> Optional[Run]:
        while True:
            await asyncio.sleep(self.options.polling_interval)
            run = await self._client.beta.threads.runs.retrieve(thread_id=thread_id, run_id=run_id)
            if run.status == "requires_action":
                if handle_actions:
                    return run
                break
            if run.status == "cancelled":
                return run
            if run.status == "failed":
                return run
            if run.status == "completed":
                return run
            if run.status == "expired":
                return run
        return None

    def _generate_plan_from_tools(self, state: TurnState, required_action: RequiredAction) -> Plan:
        plan = Plan()
        tool_map: Dict = {}
        for tool_call in required_action.submit_tool_outputs.tool_calls:
            tool_map[tool_call.function.name] = tool_call.id
            plan.commands.append(
                PredictedDoCommand(
                    action=tool_call.function.name,
                    parameters=json.loads(tool_call.function.arguments),
                )
            )
        state.set(SUBMIT_TOOL_OUTPUTS_MAP, tool_map)
        return plan

    async def _generate_plan_from_messages(self, thread_id: str, last_message_id: str) -> Plan:
        # Find the new messages
        messages = await self._client.beta.threads.messages.list(thread_id)
        new_messages = []
        for message in messages.data:
            if message.id == last_message_id:
                break
            new_messages.append(message)

        # listMessages return messages in desc, reverse to be in asc order
        new_messages.reverse()

        # Convert the messages to SAY commands
        plan = Plan()
        for message in new_messages:
            for content in message.content:
                if content.type == "text":
                    plan.commands.append(PredictedSayCommand(response=content.text.value))

        return plan

    async def _block_on_in_progress_runs(self, thread_id: str) -> None:
        # We loop until we're told the last run is completed
        while True:
            run = await self._retrieve_last_run(thread_id)
            if not run:
                return
            if self._is_run_completed(run):
                return

            # Wait for the current run to complete and then
            # loop to see if there's already a new run.
            await self._wait_for_run(thread_id, run.id)

    async def _retrieve_last_run(self, thread_id: str) -> Optional[Run]:
        list = await self._client.beta.threads.runs.list(thread_id, limit=1)
        if len(list.data) > 0:
            return list.data[0]
        return None

    def _is_run_completed(self, run: Run) -> bool:
        if run.status == "completed":
            return True
        if run.status == "failed":
            return True
        if run.status == "cancelled":
            return True
        if run.status == "expired":
            return True
        return False

    async def _submit_user_input(self, state: TurnState) -> Plan:
        # Get the current thread_id
        thread_id = await self._ensure_thread_created(state)

        # Add the users input to the thread
        message = await self._client.beta.threads.messages.create(
            thread_id, role="user", content=state.temp.input
        )

        # Create a new run
        run = await self._client.beta.threads.runs.create(
            thread_id=thread_id, assistant_id=self.options.assistant_id
        )

        # Update state and wait for the run to complete
        state.set(
            self._options.assistants_state_variable, AssistantsState(thread_id, run.id, message.id)
        )
        results = await self._wait_for_run(thread_id, run.id, True)

        if results:
            if results.status == "requires_action" and results.required_action is not None:
                state.set(SUBMIT_TOOL_OUTPUTS_VARIABLE, True)
                return self._generate_plan_from_tools(state, results.required_action)
            if results.status == "completed":
                state.set(SUBMIT_TOOL_OUTPUTS_VARIABLE, False)
                return await self._generate_plan_from_messages(thread_id, message.id)
            if results.status == "cancelled":
                return Plan()
            if results.status == "expired":
                return Plan(commands=[PredictedDoCommand(action=ActionTypes.TOO_MANY_STEPS)])

            if results.last_error:
                raise ApplicationError(
                    f"Run failed {results.status}. ErrorCode: "
                    + f"{results.last_error.code}. ErrorMessage: {results.last_error.message}"
                )

        return Plan()
