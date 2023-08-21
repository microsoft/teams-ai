"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from abc import ABC, abstractmethod
from typing import Any, Callable, Generic, TypeVar, Union

from botbuilder.core import TurnContext

from teams.ai.ai_history_options import AIHistoryOptions
from teams.ai.prompts import PromptTemplate
from teams.ai.state import ConversationState, TempState, TurnState, UserState

from .plan import Plan

StateT = TypeVar("StateT", bound=TurnState[ConversationState, UserState, TempState])


class Planner(ABC, Generic[StateT]):
    """
    interface implemented by all planners
    """

    @abstractmethod
    async def generate_plan(
        self,
        turn_context: TurnContext,
        state: StateT,
        prompt_name_or_template: Union[str, PromptTemplate],
        *,
        history_options: AIHistoryOptions,
    ) -> Plan:
        """
        Generates a plan based on the given turn state and prompt name or template.

        Args:
            turn_context (TurnContext): The turn context for current turn of conversation
            state (TurnState): The current turn state.
            prompt_name_or_template (Union[str, PromptTemplate]): The name of the prompt or a
            prompt template to use.
            history_options (AIHistoryOptions): The options for the AI history.

        Returns:
            Plan: The generated plan.
        """

    @abstractmethod
    def add_function(
        self, name: str, handler: Callable[[TurnContext, StateT], Any], *, allow_overrides=False
    ) -> None:
        """
        Adds a custom function to be used when rendering prompt templates.

        Args:
            name (str): The name of the function.
            handler (Callable[[TurnContext, TurnState], Any]): The business logic for the function.
            allow_overrides (bool, optional): Whether to allow overriding an existing function.
            Defaults to False.
        """
