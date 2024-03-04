"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from __future__ import annotations

from dataclasses import dataclass, field

from .moderators.default_moderator import DefaultModerator
from .moderators.moderator import Moderator
from .planners.planner import Planner


@dataclass
class AIOptions:
    planner: Planner
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
