"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from dataclasses import dataclass
from typing import Generic, Optional, TypeVar

from teams.ai.prompts import DefaultPromptManager, PromptManager
from teams.ai.turn_state import TurnState

from .history_options import AIHistoryOptions

StateT = TypeVar("StateT", bound=TurnState)


@dataclass
class AIOptions(Generic[StateT]):
    prompt_manager: PromptManager[StateT] = DefaultPromptManager
    "The prompt manager to use for generating prompts."

    prompt: Optional[str] = None
    """
    Optional. The prompt to use for the current turn.
    This allows for the use of the AI system in a free standing mode. An exception will be
    thrown if the AI system is routed to by the Application object and a prompt has not been
    """

    history = AIHistoryOptions()
    """
    Optional. The history options to use for the AI system
    `Default: tracking history with a maximum of 3 turns and 1000 tokens per turn.`
    """
