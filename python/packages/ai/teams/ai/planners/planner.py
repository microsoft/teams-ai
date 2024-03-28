"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Generic, TypeVar

from botbuilder.core import TurnContext

from ...state import TurnState
from .plan import Plan

StateT = TypeVar("StateT", bound=TurnState)


class Planner(Generic[StateT], ABC):
    """
    A planner is responsible for generating a plan that the AI system will execute.
    """

    @abstractmethod
    async def begin_task(self, context: TurnContext, state: TurnState) -> Plan:
        """
        Starts a new task.

        Args:
            context (TurnContext): The current turn context.
            state (TurnState): The current turn state.
        """

    @abstractmethod
    async def continue_task(self, context: TurnContext, state: TurnState) -> Plan:
        """
        Continues the current task.

        Args:
            context (TurnContext): The current turn context.
            state (TurnState): The current turn state.
        """
