"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from dataclasses import dataclass, field

from .conversation_history import ConversationHistory


@dataclass
class ConversationState:
    """
    inherit a new interface from this base interface to strongly type
    the applications conversation state
    """

    history: ConversationHistory = field(default_factory=ConversationHistory)
