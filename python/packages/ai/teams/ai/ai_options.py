"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Generic, TypeVar

from ..state import TurnState
from .moderators.default_moderator import DefaultModerator
from .moderators.moderator import Moderator
from .planners.planner import Planner

StateT = TypeVar("StateT", bound=TurnState)


@dataclass
class AIOptions(Generic[StateT]):
    planner: Planner[StateT]
    """
    The planner to use for generating plans.
    """

    moderator: Moderator = field(default_factory=DefaultModerator)
    """
    Optional. The moderator to use for moderating input passed to
    the model and the output return by the model.
    """

    allow_looping: bool = True
    """
    Optional. If true, the AI system will allow the planner to loop.
    Default `True`
    """

    enable_feedback_loop: bool = False
    """
    Optional. If true, the AI system will enable the feedback loop in Teams that
    allows a user to give thumbs up or down to a response.
    """
