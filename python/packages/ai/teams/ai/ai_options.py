"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from dataclasses import dataclass, field

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

    prompt: str = "default"
    """
    The prompt to use for the current turn.
    """

    history: AIHistoryOptions = field(default_factory=AIHistoryOptions)
    """
    Optional. The history options to use for the AI system
    `Default: tracking history with a maximum of 3 turns and 1000 tokens per turn.`
    """
