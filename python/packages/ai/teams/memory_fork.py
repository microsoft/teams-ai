"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from abc import ABC, abstractmethod
from typing import Any, Optional, TypeVar

ValueT = TypeVar("ValueT")


class Memory(ABC):
    """
    Represents a memory.

    .. remarks::
    A memory is a key-value store that can be used to store and retrieve values.
    """

    @abstractmethod
    def delete_value(
        self,
        path: str,
    ) -> None:
        """
        Deletes a value from the memory.

        Args:
            path (str): Path to the value to delete in the form of `[scope].property`. 
            If scope is omitted, the value is deleted from the temporary scope.
        """

    @abstractmethod
    def has_value(
        self,
        path: str,
    ) -> bool:
        """
        Checks if a value exists in the memory.

        Args:
            path (str): Path to the value to check in the form of `[scope].property`.
            If scope is omitted, the value is checked in the temporary scope.

        Returns:
            bool: True if the value exists, false otherwise.
        """

    @abstractmethod
    def get_value(
        self,
        path: str,
    ) -> Optional[ValueT]:
        """
        Retrieves a value from the memory.

        Args:
            path (str): Path to the value to retrieve in the form of `[scope].property`.
            If scope is omitted, the value is retrieved from the temporary scope.

        Returns:
            ValueT: The value or undefined if not found
        """

    @abstractmethod
    def set_value(
        self,
        path: str,
        value: Any,
    ) -> None:
        """
        Assigns a value to the memory.

        Args:
            path (str):  Path to the value to assign in the form of `[scope].property`.
            If scope is omitted, the value is assigned to the temporary scope.
            value (Any): Value to assign.
        """
