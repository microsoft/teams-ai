"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from __future__ import annotations

from typing import Any, Dict, Iterator, MutableMapping, Optional


class TurnStateEntry(MutableMapping[str, Any]):
    """Accessor class for managing an individual state scope."""

    _storage_key: Optional[str]
    _deleted: bool = False
    _hash: str
    data: Dict[str, Any]

    def __init__(self, value: Optional[Dict[str, Any]] = None, storage_key: Optional[str] = None):
        """Creates a new instance of the `TurnStateEntry` class.

        Args:
            value (Optional[Dict[str, Any]], optional): Value to initialize the state scope with.
                Defaults to None which means creating an empty dict.
            storage_key (Optional[str], optional): Storage key to use when persisting the
                state scope. Defaults to None.
        """
        super().__init__()
        self.data = value or {}
        self._storage_key = storage_key
        self._hash = str(self.data)

    @property
    def has_changed(self) -> bool:
        """Gets a value indicating whether the state scope has changed since it was last loaded.

        Returns:
            bool: True if the value has changed, False otherwise.
        """
        return str(self.data) != self._hash

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
        self.data = {}
        self._deleted = True

    def replace(self, value: Optional[Dict[str, Any]] = None) -> None:
        """Replaces the state scope with a new value.

        Args:
            value (Optional[Dict[str, Any]], optional): New value to replace the state scope with.
        """
        self.data = {}
        self._deleted = False

        if not value:
            return None

        self.data = value
        return None

    def __getitem__(self, key: str) -> Optional[Any]:
        self._deleted = False
        return self.data.get(key)

    def __setitem__(self, key: str, value: Any) -> None:
        self._deleted = False
        self.data[key] = value

    def __contains__(self, key: object) -> bool:
        return key in self.data

    def __delitem__(self, key: str) -> None:
        if key in self.data:
            del self.data[key]

    def __iter__(self) -> Iterator[str]:
        return iter(self.data)

    def __len__(self) -> int:
        return len(self.data)

    def __getattribute__(self, name: str) -> Any:
        if name == "data":
            self._deleted = False

        return super().__getattribute__(name)
