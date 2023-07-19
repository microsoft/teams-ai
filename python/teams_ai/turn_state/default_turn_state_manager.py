"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from dataclasses import dataclass
from typing import TypeVar, Generic
from botbuilder.core import TurnContext, Storage

from .turn_state_entry import TurnStateEntry
from .turn_state_manager import TurnState, TurnStateManager


@dataclass
class DefaultConversationState:
    """
    inherit a new interface from this base interface to strongly type
    the applications conversation state
    """


@dataclass
class DefaultUserState:
    """
    inherit a new interface from this base interface to strongly type
    the applications user state
    """


@dataclass
class DefaultTempState:
    """
    inherit a new interface from this base interface to strongly type
    the applications temp state
    """

    input: str
    "input passed to an AI prompt"

    history: str
    "formatted conversation history for embedding in an AI prompt"

    output: str
    "output returned from an AI prompt or function"


ConversationStateT = TypeVar("ConversationStateT", DefaultConversationState)
UserStateT = TypeVar("UserStateT", DefaultUserState)
TempStateT = TypeVar("TempStateT", DefaultTempState)


class DefaultTurnState(TurnState, Generic[ConversationStateT, UserStateT,
                                          TempStateT]):
    """
    defines the default state scopes persisted by the `DefaultTurnStateManager`
    """

    conversation: TurnStateEntry[ConversationStateT]
    user: TurnStateEntry[UserStateT]
    temp: TurnStateEntry[TempStateT]


class DefaultTurnStateManager(
        TurnStateManager[DefaultTurnState[ConversationStateT, UserStateT,
                                          TempStateT]],
        Generic[ConversationStateT, UserStateT, TempStateT]):
    """
    default turn state manager implementation
    """

    async def load_state(
        self, storage: Storage, context: TurnContext
    ) -> DefaultTurnState[ConversationStateT, UserStateT, TempStateT]:
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

        return DefaultTurnState[ConversationStateT, UserStateT, TempStateT](
            conversation=TurnStateEntry(items[convo_key], convo_key),
            user=TurnStateEntry(items[user_key], user_key),
            temp=TurnStateEntry({}))
