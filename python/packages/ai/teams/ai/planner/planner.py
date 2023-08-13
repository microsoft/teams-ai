"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

# pylint: skip-file

from abc import ABC, abstractclassmethod
from typing import Any, Callable, Union

from botbuilder.core import TurnContext

from teams.ai.planner.ai_history_options import AIHistoryOptions
from teams.ai.planner.plan import Plan
from teams.ai.prompts import PromptTemplate
from teams.ai.turn_state import TurnState


class Planner(ABC):
    """
    interface implemented by all planners
    """

    @abstractclassmethod
    async def generate_plan(
        self,
        turn_context: TurnContext,
        state: TurnState,
        prompt_name_or_template: Union[str, PromptTemplate],
        *,
        history_options: AIHistoryOptions,
    ) -> Plan:
        """
        Generates a plan based on the given turn state and prompt name or template.

        Args:
            turn_context (TurnContext): The turn context for current turn of conversation
            state (TurnState): The current turn state.
            prompt_name_or_template (Union[str, PromptTemplate]): The name of the prompt or a prompt template to use.
            history_options (AIHistoryOptions): The options for the AI history.

        Returns:
            Plan: The generated plan.
        """

    @abstractclassmethod
    async def add_function(
        self, name: str, handler: Callable[[TurnContext, TurnState], Any], *, allow_overrides=False
    ) -> None:
        """
        Adds a custom function to be used when rendering prompt templates.

        Args:
            name (str): The name of the function.
            handler (Callable[[TurnContext, TurnState], Any]): The business logic for the function.
            allow_overrides (bool, optional): Whether to allow overriding an existing function. Defaults to False.
        """
