"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from abc import ABC
from dataclasses import dataclass, field
from typing import Optional

from botbuilder.core import Storage
from botbuilder.schema import Activity

from .conversation_state import ConversationState
from .temp_state import TempState
from .user_state import UserState


@dataclass
class TurnState(ABC):
    "defines the default application state"

    conversation: ConversationState
    user: UserState
    temp: TempState = field(default_factory=TempState)

    async def save(self, storage: Storage) -> None:
        await self.conversation.save(storage)
        await self.user.save(storage)

    @classmethod
    async def from_activity(
        cls, activity: Activity, storage: Optional[Storage] = None
    ) -> "TurnState":
        return cls(
            conversation=await ConversationState.from_activity(activity, storage),
            user=await UserState.from_activity(activity, storage),
        )
