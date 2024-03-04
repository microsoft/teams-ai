"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from __future__ import annotations

from typing import Any, Dict, Optional

from botbuilder.core import Storage, StoreItem, TurnContext

from .state import State, state


@state
class ConversationState(State[Any]):
    """
    Default Conversation State
    """

    @classmethod
    async def load(
        cls, context: TurnContext, storage: Optional[Storage] = None
    ) -> "ConversationState":
        activity = context.activity

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
            return cls(__key__=key)

        data: Dict[str, Any] = await storage.read([key])

        if key in data:
            if isinstance(data[key], StoreItem):
                return cls(__key__=key, **data[key].__dict__)
            return cls(__key__=key, **data[key])

        return cls(__key__=key, **data)
