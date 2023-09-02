"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from dataclasses import field
from typing import Optional

from botbuilder.core import Storage
from botbuilder.schema import Activity
from teams.ai.state import ConversationState, TurnState, UserState


class AppConversationState(ConversationState):
    lights_on: bool = field(default=False)


class AppTurnState(TurnState):
    conversation: AppConversationState

    @classmethod
    async def from_activity(
        cls, activity: Activity, storage: Optional[Storage] = None
    ) -> "AppTurnState":
        return cls(
            conversation=await AppConversationState.from_activity(activity, storage),
            user=await UserState.from_activity(activity, storage),
        )
