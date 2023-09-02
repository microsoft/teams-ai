"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from dataclasses import dataclass, field
from typing import Optional

from teams.ai.planner import Planner

from .ai_history_options import AIHistoryOptions


@dataclass
class AIOptions:
    planner: Planner
    """
    The planner to use for generating plans. For example,
    you could set this as an instance of `OpenAIPlanner` or
    `AzureOpenAIPlanner`.
    """

    prompt: Optional[str] = None
    """
    Optional. The prompt to use for the current turn.
    This allows for the use of the AI system in a free standing mode. An exception will be
    thrown if the AI system is routed to by the Application object and a prompt has not been
    """

    history: AIHistoryOptions = field(default_factory=AIHistoryOptions)
    """
    Optional. The history options to use for the AI system
    `Default: tracking history with a maximum of 3 turns and 1000 tokens per turn.`
    """
