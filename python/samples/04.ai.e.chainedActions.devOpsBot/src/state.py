"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from dataclasses import dataclass
from typing import List, Optional

from botbuilder.core import Storage, TurnContext
from dataclasses_json import DataClassJsonMixin, dataclass_json
from teams.state import TurnState, ConversationState, UserState, TempState

@dataclass_json
@dataclass
class WorkItem(DataClassJsonMixin):
    id: int
    title: str
    assigned_to: str
    status: str


class AppConversationState(ConversationState):
    greeted: bool
    next_id: int = -1
    work_items: List[WorkItem] = []
    members: List[str] = []

    @classmethod
    async def load(cls, context: TurnContext, storage: Optional[Storage] = None) -> "AppConversationState":
        state = await super().load(context, storage)
        return cls(**state)


class AppTurnState(TurnState[AppConversationState, UserState, TempState]):
    conversation: AppConversationState

    @classmethod
    async def load(cls, context: TurnContext, storage: Optional[Storage] = None) -> "AppTurnState":
        return cls(
            conversation=await AppConversationState.load(context, storage),
            user=await UserState.load(context, storage),
            temp=await TempState.load(context, storage),
        )