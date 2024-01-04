"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from .default_conversation_state import DefaultConversationState
from .default_user_state import DefaultUserState
from .default_temp_state import DefaultTempState
from .memory import Memory
from typing import TypeVar, Generic, Optional, Callable, Awaitable, Dict, List, Any

from botbuilder.core import TurnContext, Storage

TConversationState = TypeVar("TConversationState", bound=DefaultConversationState)
TUserState = TypeVar("TUserState", bound=DefaultUserState)
TTempState = TypeVar("TTempState", bound=DefaultTempState)

CONVERSATION_SCOPE = 'conversation'
USER_SCOPE = 'user'
TEMP_SCOPE = 'temp'

class TurnState(Memory, Generic[TConversationState, TUserState, TTempState]):
    _is_loaded: bool = False
    _loading_callable: Optional[Callable[[],Awaitable[bool]]]

    async def load(self, context: TurnContext, storage: Optional[Storage]) -> bool:
        # Only load on first call
        if self._is_loaded:
            return False
        
        # Check for existing load operation
        if self._loading_callable is None:
            async def load_state() -> bool:
                try:
                    # Prevent additional load attempts
                    self._is_loaded = True

                    # Compute state keys
                    keys = List[str]()
                    scopes = await self._on_compute_storage_keys(context)
                    for key in scopes:
                        keys.append(scopes[key])

                    # Read items from storage provider (if configured)
                    items = await storage.read(keys) if storage else Dict[str, Any]()

                    # Create scopes for items
                    for key in scopes:
                        storage_key = scopes[key]
 

                    return True
                except Exception as e:
                    raise e

            self._loading_callable = load_state

        return await self._loading_callable()

    async def _on_compute_storage_keys(self, context: TurnContext) -> Dict[str,str]:
        # Compute state keys
        activity = context.activity
        channel_id = activity.channel_id if activity else None
        bot_id = activity.recipient.id if activity and activity.recipient else None
        conversation_id = activity.conversation.id if activity and activity.conversation else None
        user_id = activity.from_property.id if activity and activity.from_property else None

        if not channel_id:
            raise ValueError("missing activity.channel_id")
        
        if not bot_id:
            raise ValueError("missing activity.recipient.id")
        
        if not conversation_id:
            raise ValueError("missing activity.conversation.id")
        
        if not user_id:
            raise ValueError("missing activity.from_property.id")
        
        keys = Dict[str, str]()
        keys[CONVERSATION_SCOPE] = f"{channel_id}/{bot_id}/conversations/{conversation_id}"
        keys[USER_SCOPE] = f"{channel_id}/{bot_id}/users/{user_id}"

        return keys