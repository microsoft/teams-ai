"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from dataclasses import dataclass, field
from typing import Optional

from botbuilder.core import Storage
from botbuilder.schema import Activity, ChannelAccount, ConversationAccount

from .conversation_history import ConversationHistory
from .state import State


@dataclass
class ConversationState(State):
    """
    inherit a new interface from this base interface to strongly type
    the applications conversation state
    """

    __key__: str
    account: ConversationAccount
    channel: ChannelAccount
    history: ConversationHistory = field(default_factory=ConversationHistory)

    async def save(self, storage: Optional[Storage] = None) -> None:
        if storage:
            await storage.write(
                {
                    self.__key__: {
                        "history": self.history,
                    },
                }
            )

    @classmethod
    async def from_activity(
        cls, activity: Activity, storage: Optional[Storage] = None
    ) -> "ConversationState":
        if not activity.channel_id:
            raise ValueError("missing activity.channel_id")
        if not activity.conversation:
            raise ValueError("missing activity.conversation")
        if not activity.recipient:
            raise ValueError("missing activity.recipient")

        channel_id = activity.channel_id
        conversation_id = activity.conversation.id
        bot_id = activity.recipient.id
        key = f"{channel_id}/{bot_id}/conversations/{conversation_id}"

        if not storage:
            return cls(
                __key__=key,
                account=activity.conversation,
                channel=activity.recipient,
            )

        data = await storage.read([key])
        history = ConversationHistory()

        if data and data[key] and data[key]["history"]:
            history = data[key]["history"]

        return cls(
            __key__=key,
            account=activity.conversation,
            channel=activity.recipient,
            history=history,
        )
