"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from abc import ABC, abstractmethod

from botbuilder.core import TurnContext

from ...state import TurnState
from ..ai import AI
from .plan import Plan


class Planner(ABC):
    """
    A planner is responsible for generating a plan that the AI system will execute.
    """

    @abstractmethod
    async def begin_task(self, context: TurnContext, state: TurnState, ai: AI) -> Plan:
        """
        Starts a new task.

        Args:
            context (TurnContext): The current turn context.
            state (TurnState): The current turn state.
            ai (AI): The AI system that is generating the plan.
        """

    @abstractmethod
    async def continue_task(self, context: TurnContext, state: TurnState, ai: AI) -> Plan:
        """
        Continues the current task.

        Args:
            context (TurnContext): The current turn context.
            state (TurnState): The current turn state.
            ai (AI): The AI system that is generating the plan.
        """
