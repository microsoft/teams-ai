"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from typing import Optional, List, Dict, Union

from botbuilder.core import Storage, TurnContext
from teams.state import ConversationState, TempState, TurnState, UserState
from datetime import datetime

class AppConversationState(ConversationState):
    message_history: Union[List[Dict], None] = None
    is_waiting_for_user_input: bool = False
    started_waiting_for_user_input_at: Union[datetime, str, None] = None
    spec_details: Union[str, None] = None

    @classmethod
    async def load(
        cls, context: TurnContext, storage: Optional[Storage] = None
    ) -> "AppConversationState":
        state = await super().load(context, storage)
        return cls(**state)
    
    async def clear(self, context: TurnContext) -> None:
        self.is_waiting_for_user_input = False
        self.started_waiting_for_user_input_at = None
        self.spec_details = None
        await self.save(context)


class AppTurnState(TurnState[AppConversationState, UserState, TempState]):
    conversation: AppConversationState

    @classmethod
    async def load(cls, context: TurnContext, storage: Optional[Storage] = None) -> "AppTurnState":
        return cls(
            conversation=await AppConversationState.load(context, storage),
            user=await UserState.load(context, storage),
            temp=await TempState.load(context, storage),
        )
