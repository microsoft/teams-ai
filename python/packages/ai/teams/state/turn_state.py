"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from .default_temp_state import DefaultTempState
from .turn_state_entry import TurnStateEntry
from .memory import Memory
from typing import TypeVar, Generic, Optional, Callable, Awaitable, Dict, List, Any

from botbuilder.core import TurnContext, Storage


CONVERSATION_SCOPE = 'conversation'
USER_SCOPE = 'user'
TEMP_SCOPE = 'temp'

class TurnState(Memory):
    _scopes: Dict[str, TurnStateEntry] = Dict[str, TurnStateEntry]()
    _is_loaded: bool = False
    _loading_callable: Optional[Callable[[],Awaitable[bool]]] = None

    @property
    def conversation(self) -> Dict[str,Any]:
        scope = self.get_scope(CONVERSATION_SCOPE)
        if not scope:
            raise Exception("TurnState hasn't been loaded. Call loadState() first.")
        
        return scope.value

    @property
    def temp(self) -> DefaultTempState:
        scope = self.get_scope(TEMP_SCOPE)
        if not scope:
            raise Exception("TurnState hasn't been loaded. Call loadState() first.")
        
        return DefaultTempState(scope.value)

    def get_scope(self, scope: str) -> Optional[TurnStateEntry]:
        return self._scopes.get(scope, None)

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
                        value = items[storage_key]
                        self._scopes[key] = TurnStateEntry(value, storage_key)

                    # Add the temp scope
                    self._scopes[TEMP_SCOPE] = TurnStateEntry(Dict[str, Any]())

                    # Clear loading promise
                    self._is_loaded = True
                    self._loading_callable = None
                    return True
                except Exception as e:
                    self._loading_callable = None
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