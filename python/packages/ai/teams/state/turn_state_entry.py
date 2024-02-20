"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""
from typing import Any, Dict, Optional


class TurnStateEntry(Dict[str, Any]):
    """Accessor class for managing an individual state scope."""

    _storage_key: Optional[str]
    _deleted: bool = False
    _hash: str

    def __init__(self, value: Optional[Dict[str, Any]] = None, storage_key: Optional[str] = None):
        """Creates a new instance of the `TurnStateEntry` class.

        Args:
            value (Optional[Dict[str, Any]], optional): Value to initialize the state scope with.
                Defaults to None which means creating an empty dict.
            storage_key (Optional[str], optional): Storage key to use when persisting the
                state scope. Defaults to None.
        """
        super().__init__(value or {})
        self._storage_key = storage_key
        self._hash = str(self.items())

    @property
    def has_changed(self) -> bool:
        """Gets a value indicating whether the state scope has changed since it was last loaded.

        Returns:
            bool: True if the value has changed, False otherwise.
        """
        return str(self.items()) != self._hash

    @property
    def is_deleted(self) -> bool:
        """Gets a value indicating whether the state scope has been deleted.

        Returns:
            bool: True if the state entry is deleted, False otherwise.
        """
        return self._deleted

    @property
    def storage_key(self) -> Optional[str]:
        """Gets the storage key used to persist the state scope.

        Returns:
            Optional[str]: The storage key used to persist the state scope.
        """
        return self._storage_key

    def delete(self) -> None:
        """Clears the state scope."""
        self._deleted = True
        self.clear()

    def replace(self, value: Optional[Dict[str, Any]] = None) -> None:
        """Replaces the state scope with a new value.

        Args:
            value (Optional[Dict[str, Any]], optional): New value to replace the state scope with.
        """
        self.clear()

        if not value:
            return None

        for key in value:
            self[key] = value

        return None
