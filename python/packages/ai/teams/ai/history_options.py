"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from dataclasses import dataclass
from enum import Enum


class AssistantHistoryType(str, Enum):
    TEXT = "__TEXT__"
    PLAN_OBJECT = "__PLAN_OBJECT__"


@dataclass
class AIHistoryOptions:
    track_history = True
    "Whether the AI system should track conversation history. `Default: True`"

    max_turns = 3
    "The maximum number of turns to remember. `Default: 3`"

    max_tokens = 1000
    "The maximum number of tokens worth of history to add to the prompt. `Default: 1000`"

    line_separator = "\n"
    "The line separator to use when concatenating history. `Default: '\n'`"

    user_prefix = "User:"
    'The prefix to use for user history. `Default: "User:"`'

    assistant_prefix = "Assistant:"
    'The prefix to use for assistant history. `Default: "Assistant:"`'

    assistant_history_type = AssistantHistoryType.PLAN_OBJECT
    """
    Whether the conversation history should include the plan object returned by the model or
    just the text of any SAY commands.
    `Default: AssistantHistoryType.PLAN_OBJECT`
    """
