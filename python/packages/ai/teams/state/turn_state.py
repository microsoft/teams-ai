"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from .default_conversation_state import DefaultConversationState
from .default_user_state import DefaultUserState
from .default_temp_state import DefaultTempState
from .turn_state_entry import TurnStateEntry
from .memory import Memory
from typing import Optional, Callable, Awaitable, Dict, List, Any

from botbuilder.core import TurnContext, Storage
from dataclasses import dataclass
import asyncio

CONVERSATION_SCOPE = 'conversation'
USER_SCOPE = 'user'
TEMP_SCOPE = 'temp'

@dataclass
class _GetScopeAndNameResult:
    scope: TurnStateEntry
    name: str

class TurnState(Memory):
    _scopes: Dict[str, TurnStateEntry]
    _is_loaded: bool
    _loading_callable: Optional[Callable[[],Awaitable[bool]]]

    def __init__(self):
        super().__init__()
        self._scopes = dict()
        self._is_loaded = False
        self._loading_callable = None

    @property
    def conversation(self) -> DefaultConversationState:
        scope = self.get_scope(CONVERSATION_SCOPE)
        if not scope:
            raise Exception("TurnState hasn't been loaded. Call loadState() first.")
        
        return DefaultConversationState(scope.value)

    @conversation.setter
    def conversation(self, value: DefaultConversationState):
        scope = self.get_scope(CONVERSATION_SCOPE)
        if not scope:
            raise Exception("TurnState hasn't been loaded. Call loadState() first.")
        
        scope.replace(value.get_dict())

    @property
    def is_loaded(self) -> bool:
        return self._is_loaded

    @property
    def temp(self) -> DefaultTempState:
        scope = self.get_scope(TEMP_SCOPE)
        if not scope:
            raise Exception("TurnState hasn't been loaded. Call loadState() first.")
        
        return DefaultTempState(scope.value)

    @temp.setter
    def temp(self, value: DefaultTempState):
        scope = self.get_scope(TEMP_SCOPE)
        if not scope:
            raise Exception("TurnState hasn't been loaded. Call loadState() first.")
        
        scope.replace(value.get_dict())

    @property
    def user(self) -> DefaultUserState:
        scope = self.get_scope(USER_SCOPE)
        if not scope:
            raise Exception("TurnState hasn't been loaded. Call loadState() first.")
        
        return DefaultUserState(scope.value)
    
    @user.setter
    def user(self, value: DefaultUserState):
        scope = self.get_scope(USER_SCOPE)
        if not scope:
            raise Exception("TurnState hasn't been loaded. Call loadState() first.")
        
        scope.replace(value.get_dict())

    def delete_conversation_state(self) -> None:
        scope = self.get_scope(CONVERSATION_SCOPE)
        if not scope:
            raise Exception("TurnState hasn't been loaded. Call loadState() first.")
        
        scope.delete()

    def delete_temp_state(self) -> None:
        scope = self.get_scope(TEMP_SCOPE)
        if not scope:
            raise Exception("TurnState hasn't been loaded. Call loadState() first.")
        
        scope.delete()

    def delete_user_state(self) -> None:
        scope = self.get_scope(USER_SCOPE)
        if not scope:
            raise Exception("TurnState hasn't been loaded. Call loadState() first.")
        
        scope.delete()

    def get_scope(self, scope: str) -> Optional[TurnStateEntry]:
        return self._scopes.get(scope, None)
    
    def delete_value(self, path: str) -> None:
        scope_and_name = self._get_scope_and_name(path)
        scope = scope_and_name.scope
        name = scope_and_name.name
        if name in scope.value:
            del scope.value[name]

    def has_value(self, path: str) -> bool:
        scope_and_name = self._get_scope_and_name(path)
        scope = scope_and_name.scope
        name = scope_and_name.name
        return name in scope.value
    
    def get_value(self, path: str) -> Optional[Any]:
        scope_and_name = self._get_scope_and_name(path)
        scope = scope_and_name.scope
        name = scope_and_name.name
        return scope.value[name] if name in scope.value else None
    
    def set_value(self, path: str, value: Any) -> None:
        scope_and_name = self._get_scope_and_name(path)
        scope = scope_and_name.scope
        name = scope_and_name.name
        scope.value[name] = value

    async def load(self, context: TurnContext, storage: Optional[Storage] = None) -> bool:
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
                    keys = list()
                    scopes = await self._on_compute_storage_keys(context)
                    for key in scopes:
                        keys.append(scopes[key])

                    # Read items from storage provider (if configured)
                    items = await storage.read(keys) if storage else dict()

                    # Create scopes for items
                    for key in scopes:
                        storage_key = scopes[key]
                        value = items.get(storage_key, dict())
                        self._scopes[key] = TurnStateEntry(value, storage_key)

                    # Add the temp scope
                    self._scopes[TEMP_SCOPE] = TurnStateEntry(dict())

                    # Clear loading promise
                    self._is_loaded = True
                    self._loading_callable = None
                    return True
                except Exception as e:
                    self._loading_callable = None
                    self._is_loaded = False
                    raise e

            self._loading_callable = load_state

        return await self._loading_callable()

    async def save(self, context: TurnContext, storage: Optional[Storage] = None) -> None:
        # Check for existing load operation
        if not self._is_loaded and self._loading_callable is not None:
            # Wait for load to finish
            await self._loading_callable()

        if not self._is_loaded:
            raise Exception("TurnState hasn't been loaded. Call loadState() first.")

        # Find changes and deletions
        changes = {}
        deletions = []
        for key in self._scopes:
            entry = self._scopes[key]
            if entry.storage_key:
                if entry.is_deleted:
                    deletions.append(entry.storage_key)
                elif entry.has_changed:
                    changes[entry.storage_key] = entry.value
        
       # Do we have a storage provider?
        if storage:
            # Apply changes
            awaitables = []
            if changes:
                awaitables.append(storage.write(changes))

            # Apply deletions
            if deletions:
                awaitables.append(storage.delete(deletions))

            # Wait for completion
            if len(awaitables) > 0:
                await asyncio.gather(*awaitables)

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
        
        keys = dict()
        keys[CONVERSATION_SCOPE] = f"{channel_id}/{bot_id}/conversations/{conversation_id}"
        keys[USER_SCOPE] = f"{channel_id}/{bot_id}/users/{user_id}"

        return keys

    def _get_scope_and_name(self, path: str) -> _GetScopeAndNameResult:
        # Get variable scope and name
        parts = path.split('.')
        if len(parts) > 2:
            raise Exception(f"Invalid state path: {path}")
        elif len(parts) == 1:
            parts.insert(0, TEMP_SCOPE)

        # Validate scope
        scope = self.get_scope(parts[0])
        if not scope:
            raise Exception(f"Invalid state scope: {parts[0]}")

        return _GetScopeAndNameResult(scope, parts[1])