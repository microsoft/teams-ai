"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

import asyncio
from typing import Any, Awaitable, Callable, Dict, Optional, cast

from botbuilder.core import Storage, TurnContext

from ..app_error import ApplicationError
from .default_conversation_state import DefaultConversationState
from .default_temp_state import DefaultTempState
from .default_user_state import DefaultUserState
from .memory import Memory
from .turn_state_entry import TurnStateEntry

CONVERSATION_SCOPE = "conversation"
USER_SCOPE = "user"
TEMP_SCOPE = "temp"


class TurnState(Memory):
    """
    Base class defining a collection of turn state scopes.

    Developers can create a derived class that extends `TurnState` to add additional state scopes.
    Example:
        ```python
        class CustomTurnState(TurnState):
            CUSTOM_SCOPE = "custom"

            @property
            def custom(self) -> DefaultCustomState:
                scope = self.get_scope(self.CUSTOM_SCOPE)
                if not scope:
                    raise ApplicationError("TurnState hasn't been loaded. Call loadState() first.")

                return DefaultCustomState(scope.value)

            @custom.setter
            def custom(self, value: DefaultCustomState):
                scope = self.get_scope(self.CUSTOM_SCOPE)
                if not scope:
                    raise ApplicationError("TurnState hasn't been loaded. Call loadState() first.")

                scope.replace(value.get_dict())

            async def _on_compute_storage_keys(self, context: TurnContext) -> Dict[str, str]:
                # Call the parent class's method first to get the existing keys
                keys = await super()._on_compute_storage_keys(context)

                # Add the new scope to the keys dictionary
                keys[self.CUSTOM_SCOPE] = "my_scope_key"

                return keys
        ```
    """

    _is_loaded: bool
    _loading_callable: Optional[Callable[[], Awaitable[bool]]]

    def __init__(self):
        """Initialize the class."""
        super().__init__()
        self._is_loaded = False
        self._loading_callable = None

    @property
    def conversation(self) -> DefaultConversationState:
        """Accessor for the conversation state.

        Returns:
            DefaultConversationState: The current conversation state.

        Raises:
            ApplicationError: If the state has not been loaded.
        """
        scope = self.get_scope(CONVERSATION_SCOPE)

        if not scope:
            raise ApplicationError("TurnState hasn't been loaded. Call loadState() first.")

        return DefaultConversationState(scope)

    @conversation.setter
    def conversation(self, value: DefaultConversationState):
        """Replaces the conversation state with a new value.

        Args:
            value (DefaultConversationState): New value to replace the conversation state with.

        Raises:
            ApplicationError: If the state has not been loaded.
        """
        scope = self.get_scope(CONVERSATION_SCOPE)

        if not scope:
            raise ApplicationError("TurnState hasn't been loaded. Call loadState() first.")

        scope.replace(value.get_dict())

    @property
    def is_loaded(self) -> bool:
        """Gets a value indicating whether the applications turn state has been loaded.

        Returns:
            bool: True if the state is loaded, False otherwise.
        """
        return self._is_loaded

    @property
    def temp(self) -> DefaultTempState:
        """Accessor for the temp state.

        Returns:
            DefaultTempState: The current temporary state.

        Raises:
            ApplicationError: If the state has not been loaded.
        """
        scope = self.get_scope(TEMP_SCOPE)

        if not scope:
            raise ApplicationError("TurnState hasn't been loaded. Call loadState() first.")

        return DefaultTempState(scope)

    @temp.setter
    def temp(self, value: DefaultTempState):
        """Replaces the temp state with a new value.

        Args:
            value (DefaultTempState): New value to replace the temp state with.

        Raises:
            ApplicationError: If the state has not been loaded.
        """
        scope = self.get_scope(TEMP_SCOPE)

        if not scope:
            raise ApplicationError("TurnState hasn't been loaded. Call loadState() first.")

        scope.replace(value.get_dict())

    @property
    def user(self) -> DefaultUserState:
        """Accessor for the user state.

        Returns:
            DefaultUserState: The current user state.

        Raises:
            ApplicationError: If the state has not been loaded.
        """
        scope = self.get_scope(USER_SCOPE)

        if not scope:
            raise ApplicationError("TurnState hasn't been loaded. Call loadState() first.")

        return DefaultUserState(scope)

    @user.setter
    def user(self, value: DefaultUserState):
        """Replaces the user state with a new value.

        Args:
            value (DefaultUserState): New value to replace the user state with.

        Raises:
            ApplicationError: If the state has not been loaded.
        """
        scope = self.get_scope(USER_SCOPE)

        if not scope:
            raise ApplicationError("TurnState hasn't been loaded. Call loadState() first.")

        scope.replace(value.get_dict())

    def delete_conversation_state(self) -> None:
        """Deletes the state object for the current conversation from storage.

        Raises:
            ApplicationError: If the state has not been loaded.
        """
        scope = self.get_scope(CONVERSATION_SCOPE)

        if not scope:
            raise ApplicationError("TurnState hasn't been loaded. Call loadState() first.")

        scope.delete()

    def delete_temp_state(self) -> None:
        """Deletes the temp state object.

        Raises:
            ApplicationError: If the state has not been loaded.
        """
        scope = self.get_scope(TEMP_SCOPE)

        if not scope:
            raise ApplicationError("TurnState hasn't been loaded. Call loadState() first.")

        scope.delete()

    def delete_user_state(self) -> None:
        """Deletes the state object for the current user from storage.

        Raises:
            ApplicationError: If the state has not been loaded.
        """
        scope = self.get_scope(USER_SCOPE)

        if not scope:
            raise ApplicationError("TurnState hasn't been loaded. Call loadState() first.")

        scope.delete()

    def get_scope(self, scope: str) -> Optional[TurnStateEntry]:
        """Gets a state scope by name.

        Args:
            scope (str): Name of the state scope to return. (i.e. 'conversation', 'user', or 'temp')

        Returns:
            Optional[TurnStateEntry]: The state scope or None if not found.
        """
        return cast(TurnStateEntry, self._scopes.get(scope, None))

    def delete_value(self, path: str) -> None:
        """Deletes a value from the memory.

        Args:
            path (str): Path to the value to delete in the form of `[scope].property`.
              If scope is omitted, the value is deleted from the temporary scope.
        """
        scope, name = self._get_scope_and_name(path)

        if not scope in self._scopes or not name in self._scopes[scope]:
            return None

        del self._scopes[scope][name]
        return None

    def has_value(self, path: str) -> bool:
        """Checks if a value exists in the memory.

        Args:
            path (str): Path to the value to check in the form of `[scope].property`.
              If scope is omitted, the value is checked in the temporary scope.

        Returns:
            bool: True if the value exists, False otherwise.
        """
        scope, name = self._get_scope_and_name(path)

        if not scope in self._scopes:
            return False

        return name in self._scopes[scope]

    def get_value(self, path: str) -> Optional[Any]:
        """Retrieves a value from the memory.

        Args:
            path (str): Path to the value to retrieve in the form of `[scope].property`.
              If scope is omitted, the value is retrieved from the temporary scope.

        Returns:
            Optional[Any]: The value or None if not found.
        """
        scope, name = self._get_scope_and_name(path)

        if not scope in self._scopes:
            return None

        return self._scopes[scope][name] if name in self._scopes[scope] else None

    def set_value(self, path: str, value: Any) -> None:
        """Assigns a value to the memory.

        Args:
            path (str): Path to the value to assign in the form of `[scope].property`.
              If scope is omitted, the value is assigned to the temporary scope.
            value (Any): Value to assign.
        """
        scope, name = self._get_scope_and_name(path)

        if not scope in self._scopes:
            self._scopes[scope] = TurnStateEntry()

        self._scopes[scope][name] = value

    async def load(self, context: TurnContext, storage: Optional[Storage] = None) -> bool:
        """Loads all of the state scopes for the current turn.

        Args:
            context (TurnContext): Context for the current turn of conversation with the user.
            storage (Optional[Storage]): Storage provider to load state scopes from.

        Returns:
            bool: True if the states needed to be loaded.
        """
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
                    keys = []
                    scopes = await self._on_compute_storage_keys(context)
                    for key in scopes:
                        keys.append(scopes[key])

                    # Read items from storage provider (if configured)
                    items = await storage.read(keys) if storage else {}

                    # Create scopes for items
                    for key in scopes:
                        storage_key = scopes[key]
                        value = items.get(storage_key, {})
                        self._scopes[key] = TurnStateEntry(value, storage_key)

                    # Add the temp scope
                    self._scopes[TEMP_SCOPE] = TurnStateEntry({})

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

    async def save(self, _context: TurnContext, storage: Optional[Storage] = None) -> None:
        """Saves all of the state scopes for the current turn.

        Args:
            _context (TurnContext): Context for the current turn of conversation with the user.
            storage (Optional[Storage]): Storage provider to save state scopes to.

        Raises:
            ApplicationError: If the state hasn't been loaded before the save operation.
        """
        # Check for existing load operation
        if not self._is_loaded and self._loading_callable is not None:
            # Wait for load to finish
            await self._loading_callable()

        if not self._is_loaded:
            raise ApplicationError("TurnState hasn't been loaded. Call loadState() first.")

        # Find changes and deletions
        changes = {}
        deletions = []

        for _key, entry in self._scopes.items():
            if isinstance(entry, TurnStateEntry):
                if entry.storage_key:
                    if entry.is_deleted:
                        deletions.append(entry.storage_key)
                    elif entry.has_changed:
                        changes[entry.storage_key] = entry

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

    async def _on_compute_storage_keys(self, context: TurnContext) -> Dict[str, str]:
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

        keys = {}
        keys[CONVERSATION_SCOPE] = f"{channel_id}/{bot_id}/conversations/{conversation_id}"
        keys[USER_SCOPE] = f"{channel_id}/{bot_id}/users/{user_id}"

        return keys
