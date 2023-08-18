"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from typing import Any, Generic, List, Optional, TypeVar

from botbuilder.core import Storage, TurnContext

from .turn_state import ConversationState, TempState, TurnState, UserState
from .turn_state_entry import TurnStateEntry

StateT = TypeVar("StateT", bound=TurnState)


class TurnStateManager(Generic[StateT]):
    "responsible for loading and saving an application turn state"

    async def load_state(self, storage: Optional[Storage], context: TurnContext) -> StateT:
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
        conversation_id = context.activity.conversation.id
        bot_id = context.activity.recipient.id
        user_id = context.activity.from_property.id
        conversation_key = f"{channel_id}/{bot_id}/conversations/{conversation_id}"
        user_key = f"{channel_id}/{bot_id}/users/{user_id}"

        if storage:
            items: Any = await storage.read([conversation_key, user_key])
        else:
            items = {}

        conversation: ConversationState = (
            items[conversation_key] if conversation_key in items else ConversationState([])
        )
        user: UserState = items[user_key] if user_key in items else UserState()

        state: Any = TurnState(
            conversation=TurnStateEntry(conversation, storage_key=conversation_key),
            user=TurnStateEntry(user, storage_key=user_key),
            temp=TurnStateEntry(TempState(history="", input="", output="")),
        )

        return state

    async def save_state(self, storage: Optional[Storage], _context: TurnContext, state: StateT):
        "saves all of the state scopes for the current turn"

        if storage is None:
            return

        to_delete: List[str] = []
        changes = {}

        if state.conversation.storage_key:
            if state.conversation.is_deleted:
                to_delete.append(state.conversation.storage_key)
            elif state.conversation.has_changed:
                changes[state.conversation.storage_key] = state.conversation.value

        if state.user.storage_key:
            if state.user.is_deleted:
                to_delete.append(state.user.storage_key)
            elif state.user.has_changed:
                changes[state.user.storage_key] = state.user.value

        if state.temp.storage_key:
            if state.temp.is_deleted:
                to_delete.append(state.temp.storage_key)
            elif state.temp.has_changed:
                changes[state.temp.storage_key] = state.temp.value

        if len(changes) > 0:
            await storage.write(changes)

        if len(to_delete) > 0:
            await storage.delete(to_delete)
