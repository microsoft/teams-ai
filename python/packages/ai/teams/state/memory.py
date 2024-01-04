"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from abc import ABC, abstractmethod
from typing import Any

class Memory(ABC):

    @abstractmethod
    def delete_value(self, path: str) -> None:
        """
        Deletes a value from memory.

        Args:
            path (str): The path to the value to delete.
        """

    @abstractmethod
    def has_value(self, path: str) -> bool:
        """
        Checks if a value exists in memory.

        Args:
            path (str): The path to the value to check.

        Returns:
            bool: True if the value exists, otherwise False.
        """

    @abstractmethod
    def get_value(self, path: str) -> Any:
        """
        Gets a value from memory.

        Args:
            path (str): The path to the value to get.

        Returns:
            Any: The value.
        """

    @abstractmethod
    def set_value(self, path: str, value: Any) -> None:
        """
        Sets a value in memory.

        Args:
            path (str): The path to the value to set.
            value (Any): The value to set.
        """