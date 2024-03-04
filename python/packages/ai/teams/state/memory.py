"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from collections import UserDict
from typing import Any, Dict, MutableMapping, Optional, Tuple

from ..app_error import ApplicationError


class MemoryBase(ABC):
    """
    Memory Base
    """

    @abstractmethod
    def has(self, path: str) -> bool:
        """
        Checks if a value exists in the memory.

        Args:
            path (str): Path to the value to check in the form of `[scope].property`.
              If scope is omitted, the value is checked in the temporary scope.

        Returns:
            bool: True if the value exists, False otherwise.
        """

    @abstractmethod
    def get(self, path: str) -> Optional[Any]:
        """
        Retrieves a value from the memory.

        Args:
            path (str): Path to the value to retrieve in the form of `[scope].property`.
              If scope is omitted, the value is retrieved from the temporary scope.

        Returns:
            Any: The value or None if not found.
        """

    @abstractmethod
    def set(self, path: str, value: Any) -> None:
        """
        Assigns a value to the memory.

        Args:
            path (str): Path to the value to assign in the form of `[scope].property`.
              If scope is omitted, the value is assigned to the temporary scope.
            value (Any): Value to assign.
        """

    @abstractmethod
    def delete(self, path: str) -> None:
        """
        Deletes a value from the memory.

        Args:
            path (str): Path to the value to delete in the form of `[scope].property`.
              If scope is omitted, the value is deleted from the temporary scope.
        """

    def _get_scope_and_name(self, path: str) -> Tuple[str, str]:
        parts = path.split(".")

        if len(parts) > 2:
            raise ApplicationError(f"Invalid state path: {path}")

        if len(parts) == 1:
            parts.insert(0, "temp")

        return (parts[0], parts[1])


class Memory(MemoryBase):
    """
    Represents a memory.

    A memory is a key-value store that can be used to store and retrieve values.
    """

    _parent: Optional[MemoryBase]
    _scopes: Dict[str, MutableMapping[str, Any]]

    def __init__(self, parent: Optional[MemoryBase] = None) -> None:
        self._parent = parent
        self._scopes = {}

    def has(self, path: str) -> bool:
        scope, name = self._get_scope_and_name(path)

        if scope in self._scopes and name in self._scopes[scope]:
            return True

        if self._parent:
            return self._parent.has(path)

        return False

    def get(self, path: str) -> Optional[Any]:
        scope, name = self._get_scope_and_name(path)

        if scope in self._scopes and name in self._scopes[scope]:
            return self._scopes[scope][name]

        if self._parent:
            return self._parent.get(path)

        return None

    def set(self, path: str, value: Any) -> None:
        scope, name = self._get_scope_and_name(path)

        if not scope in self._scopes:
            self._scopes[scope] = UserDict()

        self._scopes[scope][name] = value

    def delete(self, path: str) -> None:
        scope, name = self._get_scope_and_name(path)

        if scope in self._scopes and name in self._scopes[scope]:
            del self._scopes[scope][name]
