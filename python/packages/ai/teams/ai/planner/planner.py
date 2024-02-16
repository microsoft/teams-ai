"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from abc import ABC, abstractmethod
from logging import Logger
from typing import Any, Awaitable, Callable, Optional, Union

from botbuilder.core import TurnContext

from teams.ai.ai_history_options import AIHistoryOptions
from teams.ai.state import TurnState

from ..prompts.prompt_template import PromptTemplate
from .plan import Plan


class Planner(ABC):
    """
    interface implemented by all planners
    """

    log: Optional[Logger] = None

    @abstractmethod
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
            prompt_name_or_template (Union[str, PromptTemplate]): The name of the prompt or a
            prompt template to use.
            history_options (AIHistoryOptions): The options for the AI history.

        Returns:
            Plan: The generated plan.
        """

    @abstractmethod
    def add_function(
        self,
        name: str,
        handler: Callable[[TurnContext, TurnState], Awaitable[Any]],
        *,
        allow_overrides=False,
    ) -> None:
        """
        Adds a custom function to be used when rendering prompt templates.

        Args:
            name (str): The name of the function.
            handler (Callable[[TurnContext, TurnState], Any]): The business logic for the function.
            allow_overrides (bool, optional): Whether to allow overriding an existing function.
            Defaults to False.
        """

    @abstractmethod
    async def review_prompt(
        self,
        context: TurnContext,
        state: TurnState,
        prompt: PromptTemplate,
    ) -> Optional[Plan]:
        """
        Reviews user input before it's sent to the planner.

        Args:
            context (TurnContext): The turn context for current turn of conversation
            state (TurnState): The current turn state.
            prompt (PromptTemplate): The prompt being reviewed.

        Returns:
            Plan: returns a plan when input has been flagged
        """

    @abstractmethod
    async def review_plan(
        self,
        context: TurnContext,
        state: TurnState,
        plan: Plan,
    ) -> Plan:
        """
        Reviews a plan generated by the planner before its executed.

        Args:
            context (TurnContext): The turn context for current turn of conversation
            state (TurnState): The current turn state.
            plan (Plan): The plan being reviewed.

        Returns:
            Plan: returns the plan to be executed
        """