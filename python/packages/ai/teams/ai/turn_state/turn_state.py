"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from dataclasses import dataclass
from typing import TypeVar, Generic

from .turn_state_entry import TurnStateEntry
from .conversation_state import ConversationState
from .temp_state import TempState
from .user_state import UserState

ConversationT = TypeVar("ConversationT", bound=ConversationState)
UserT = TypeVar("UserT", bound=UserState)
TempT = TypeVar("TempT", bound=TempState)


@dataclass
class TurnState(Generic[ConversationT, UserT, TempT]):
    "defines the default state scopes persisted by the `TurnStateManager`"

    conversation: TurnStateEntry[ConversationT]
    user: TurnStateEntry[UserT]
    temp: TurnStateEntry[TempT]
