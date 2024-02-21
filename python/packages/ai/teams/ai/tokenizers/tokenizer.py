"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from typing import List


class Tokenizer(ABC):
    """Abstract base class for a tokenizer.

    This class provides an interface for a tokenizer, which should be able to
    encode a string into a list of integers and decode a list of integers into a string.
    """

    @abstractmethod
    def decode(self, tokens: List[int]) -> str:
        """Decodes a list of tokens into a string.

        Args:
            tokens (List[int]): A list of integers representing tokens.

        Returns:
            str: The decoded string.
        """

    @abstractmethod
    def encode(self, text: str) -> List[int]:
        """Encodes a string into a list of tokens.

        Args:
            text (str): The text to encode.

        Returns:
            List[int]: A list of integers representing the encoded text.
        """
