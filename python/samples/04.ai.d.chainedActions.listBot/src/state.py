"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from typing import Dict, List, Optional

from botbuilder.core import Storage, TurnContext
from teams.state import TurnState, ConversationState, UserState, TempState


class AppConversationState(ConversationState):
    lists: Dict[str, List[str]] = {}

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
    
    def ensure_list_exists(self, list_name: str) -> None:
        if list_name not in self.conversation.lists:
            self.conversation.lists[list_name] = []
