"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from typing import TypeVar, Generic, Optional, List
from botbuilder.core import TurnContext, Storage

from .turn_state_entry import TurnStateEntry
from .turn_state import TurnState

TurnStateT = TypeVar("TurnStateT", bound=TurnState)


class TurnStateManager(Generic[TurnStateT]):
    "responsible for loading and saving an application turn state"

    async def load_state(self, storage: Optional[Storage],
                         context: TurnContext) -> TurnStateT:
        """
        loads all of the state scopes for the current turn\n
        `storage`: storage provider to load state scopes from\n
        `context`: context for the current turn of conversation with the user
        """

        if not context.activity:
            raise ValueError("missing context.activity")
        if not context.activity.channel_id:
            raise ValueError("missing context.activity.channel_id")
        if not context.activity.recipient:
            raise ValueError("missing context.activity.recipient")
        if not context.activity.recipient.id:
            raise ValueError("missing context.activity.recipient.id")
        if not context.activity.conversation:
            raise ValueError("missing context.activity.conversation")
        if not context.activity.conversation.id:
            raise ValueError("missing context.activity.conversation.id")
        if not context.activity.from_property:
            raise ValueError("missing context.activity.from_property")
        if not context.activity.from_property.id:
            raise ValueError("missing context.activity.from_property.id")

        channel_id = context.activity.channel_id
        convo_id = context.activity.conversation.id
        bot_id = context.activity.recipient.id
        user_id = context.activity.from_property.id
        convo_key = f"{channel_id}/{bot_id}/conversations/{convo_id}"
        user_key = f"{channel_id}/{bot_id}/users/{user_id}"

        items = {}

        if storage:
            items = await storage.read([convo_key, user_key])

        convo = items[convo_key] if convo_key in items else None
        user = items[user_key] if user_key in items else None

        return TurnState(conversation=TurnStateEntry(value=convo,
                                                     storage_key=convo_key),
                         user=TurnStateEntry(value=user, storage_key=user_key),
                         temp=TurnStateEntry())

    async def save_state(self, storage: Optional[Storage], state: TurnStateT):
        "saves all of the state scopes for the current turn"

        if storage is None:
            return

        to_delete: List[str] = []
        changes = {}

        for key in state:
            if state[key].storage_key:
                if state[key].deleted:
                    to_delete.append(state[key].storage_key)
                else:
                    changes[state[key].storage_key] = state[key].value

        if len(changes) > 0:
            await storage.write(changes)

        if len(to_delete) > 0:
            await storage.delete(to_delete)
