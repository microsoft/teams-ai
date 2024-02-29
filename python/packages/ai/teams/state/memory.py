"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from __future__ import annotations

from collections import UserDict
from typing import Any, Dict, MutableMapping, Optional, Tuple

from ..app_error import ApplicationError


class Memory:
    """
    Represents a memory.

    A memory is a key-value store that can be used to store and retrieve values.
    """

    _parent: Optional["Memory"]
    _scopes: Dict[str, MutableMapping[str, Any]]

    def __init__(self, parent: Optional["Memory"] = None) -> None:
        self._parent = parent
        self._scopes = {}

    def delete_value(self, path: str) -> None:
        """
        Deletes a value from the memory.

        Args:
            path (str): Path to the value to delete in the form of `[scope].property`.
              If scope is omitted, the value is deleted from the temporary scope.
        """
        scope, name = self._get_scope_and_name(path)

        if scope in self._scopes and name in self._scopes[scope]:
            del self._scopes[scope][name]

    def has_value(self, path: str) -> bool:
        """
        Checks if a value exists in the memory.

        Args:
            path (str): Path to the value to check in the form of `[scope].property`.
              If scope is omitted, the value is checked in the temporary scope.

        Returns:
            bool: True if the value exists, False otherwise.
        """
        scope, name = self._get_scope_and_name(path)

        if scope in self._scopes and name in self._scopes[scope]:
            return True

        if self._parent:
            return self._parent.has_value(path)

        return False

    def get_value(self, path: str) -> Optional[Any]:
        """
        Retrieves a value from the memory.

        Args:
            path (str): Path to the value to retrieve in the form of `[scope].property`.
              If scope is omitted, the value is retrieved from the temporary scope.

        Returns:
            Any: The value or None if not found.
        """
        scope, name = self._get_scope_and_name(path)

        if scope in self._scopes and name in self._scopes[scope]:
            return self._scopes[scope][name]

        if self._parent:
            return self._parent.get_value(path)

        return None

    def set_value(self, path: str, value: Any) -> None:
        """
        Assigns a value to the memory.

        Args:
            path (str): Path to the value to assign in the form of `[scope].property`.
              If scope is omitted, the value is assigned to the temporary scope.
            value (Any): Value to assign.
        """
        scope, name = self._get_scope_and_name(path)

        if not scope in self._scopes:
            self._scopes[scope] = UserDict()

        self._scopes[scope][name] = value

    def _get_scope_and_name(self, path: str) -> Tuple[str, str]:
        parts = path.split(".")

        if len(parts) > 2:
            raise ApplicationError(f"Invalid state path: {path}")

        if len(parts) == 1:
            parts.insert(0, "temp")

        return (parts[0], parts[1])
