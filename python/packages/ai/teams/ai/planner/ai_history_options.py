"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from dataclasses import dataclass
from enum import Enum


class AssistantHistoryType(str, Enum):
    TEXT = "text"
    PLAN_OBJECT = "planObject"


@dataclass
class AIHistoryOptions:
    track_history: bool = True
    "Whether the AI system should track conversation history. `Default: True`"

    max_turns: int = 3
    "The maximum number of turns to remember. `Default: 3`"

    max_tokens: int = 1000
    "The maximum number of tokens worth of history to add to the prompt. `Default: 1000`"

    line_separator: str = "\n"
    "The line separator to use when concatenating history. `Default: '\n'`"

    user_prefix: str = "User:"
    "The prefix to use for user history. `Default: \"User:\"`"

    assistant_prefix: str = "Assistant:"
    "The prefix to use for assistant history. `Default: \"Assistant:\"`"

    assistant_history_type: AssistantHistoryType = AssistantHistoryType.PLAN_OBJECT
    """
    Whether the conversation history should include the plan object returned by the model or
    just the text of any SAY commands.
    `Default: AssistantHistoryType.PLAN_OBJECT`
    """
