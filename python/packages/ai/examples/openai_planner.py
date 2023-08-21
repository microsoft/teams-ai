"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from botbuilder.core import TurnContext

from teams.ai.planner import OpenAIPlanner, OpenAIPlannerOptions
from teams.ai.state import (
    ConversationState,
    TempState,
    TurnState,
    TurnStateEntry,
    UserState,
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
