"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from typing import Any, Callable

from botbuilder.core import TurnContext

from teams.ai import OpenAIPlanner, OpenAIPlannerOptions, TurnState


async def add_function(context: TurnContext):
    options = OpenAIPlannerOptions(
        "api_key", "gpt-3.5-turbo", prompt_folder="tests/planner/test_assets"
    )
    planner = OpenAIPlanner(options)

    def function_to_add(context: TurnContext, state: TurnState):
        raise NotImplementedError()

    planner.add_function("my_function", function_to_add)


async def generate_plan(context: TurnContext):
    options = OpenAIPlannerOptions(
        "api_key", "gpt-3.5-turbo", prompt_folder="tests/planner/test_assets"
    )
    planner = OpenAIPlanner(options)
    state = await TurnState.from_activity(context.activity)
    await planner.generate_plan(context, state, "test")


class Application:
    planner: OpenAIPlanner

    def add_function(
        self,
        name: str,
        handler: Callable[[TurnContext, TurnState], Any],
    ):
        self.planner.add_function(name, handler)

    async def generate_plan(
        self,
        turn_context: TurnContext,
        state: TurnState,
        prompt_name_or_template: str,
    ):
        await self.planner.generate_plan(turn_context, state, prompt_name_or_template)
