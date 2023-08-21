"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from typing import Any, Callable, Generic, TypeVar

from botbuilder.core import TurnContext

from teams.ai.planner import OpenAIPlanner, OpenAIPlannerOptions
from teams.ai.state import (
    ConversationState,
    ConversationT,
    TempState,
    TempT,
    TurnState,
    TurnStateEntry,
    UserState,
    UserT,
)


async def add_function(turn_context: TurnContext):
    options = OpenAIPlannerOptions("api_key", "gpt-3.5-turbo", "tests/planner/test_assets")
    planner = OpenAIPlanner(options)

    def function_to_add(turn_context: TurnContext, state: TurnState):
        raise NotImplementedError()

    await planner.add_function("my_function", function_to_add)


async def generate_plan(turn_context: TurnContext):
    options = OpenAIPlannerOptions("api_key", "gpt-3.5-turbo", "tests/planner/test_assets")
    planner = OpenAIPlanner(options)
    state = TurnState(
        TurnStateEntry(ConversationState([])),
        TurnStateEntry(UserState()),
        TurnStateEntry(TempState("", "", "")),
    )

    await planner.generate_plan(turn_context, state, "test")


class Application(Generic[ConversationT, UserT, TempT]):
    planner: OpenAIPlanner

    async def add_function(
        self,
        name: str,
        handler: Callable[[TurnContext, TurnState[ConversationT, UserT, TempT]], Any],
    ):
        await self.planner.add_function(name, handler)

    async def generate_plan(
        self,
        turn_context: TurnContext,
        state: TurnState[ConversationT, UserT, TempT],
        prompt_name_or_template: str,
    ):
        await self.planner.generate_plan(turn_context, state, prompt_name_or_template)
