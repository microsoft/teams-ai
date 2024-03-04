"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from typing import Optional
from botbuilder.core import Storage, TurnContext
from teams.state import TurnState, ConversationState, UserState, TempState


class AppTempState(TempState):
    post: str = ""
    prompt: str = ""

    @classmethod
    async def load(cls, context: TurnContext, storage: Optional[Storage] = None) -> "AppTempState":
        state = await super().load(context, storage)
        return cls(**state)


class AppTurnState(TurnState[ConversationState, UserState, AppTempState]):
    temp: AppTempState

    @classmethod
    async def load(cls, context: TurnContext, storage: Optional[Storage] = None) -> "AppTurnState":
        return cls(
            conversation=await ConversationState.load(context, storage),
            user=await UserState.load(context, storage),
            temp=await AppTempState.load(context, storage),
        )