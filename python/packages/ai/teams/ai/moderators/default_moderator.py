"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from __future__ import annotations

from typing import Optional

from botbuilder.core import TurnContext

from ...state import TurnState
from ..planners.plan import Plan
from .moderator import Moderator


class DefaultModerator(Moderator):
    """
    Default moderator created by the AI system if one isn't configured.
    """

    async def review_input(self, context: TurnContext, state: TurnState) -> Optional[Plan]:
        return None

    async def review_output(self, context: TurnContext, state: TurnState, plan: Plan) -> Plan:
        return plan
