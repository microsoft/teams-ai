"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Literal

from dataclasses_json import DataClassJsonMixin, dataclass_json


@dataclass_json
@dataclass
class FeedbackLoopData(DataClassJsonMixin):
    """
    Data returned when the thumbs up or down button
    is clicked and response sent when enable_feedback_loop
    is set to true in the AI Module.
    """

    action_value: FeedbackLoopActionValue

    reply_to_id: str
    "The activity ID that the feedback was provided on."

    action_name: str = "feedback"


@dataclass_json
@dataclass
class FeedbackLoopActionValue(DataClassJsonMixin):
    """
    The value data provided with the feedback
    """

    reaction: Literal["like", "dislike"]
    "The reaction"

    feedback: str
    "The response the user provides after pressing one of the feedback buttons."
