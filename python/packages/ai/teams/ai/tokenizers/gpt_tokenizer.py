"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from __future__ import annotations

from typing import List

from tiktoken import Encoding, get_encoding

from .tokenizer import Tokenizer


class GPTTokenizer(Tokenizer):
    """Used to encode and decode text for GPT-3.5/GPT-4 model."""

    _encoding: Encoding

    def __init__(self):
        """Initializes the GPTTokenizer object."""
        self._encoding = get_encoding("cl100k_base")

    def decode(self, tokens: List[int]) -> str:
        """Decodes a list of tokens into a string.

        Args:
            tokens (List[int]): The list of tokens to be decoded.

        Returns:
            str: The decoded string.
        """
        return self._encoding.decode(tokens)

    def encode(self, text: str) -> List[int]:
        """Encodes a string into a list of tokens.

        Args:
            text (str): The string to be encoded.

        Returns:
            List[int]: The list of encoded tokens.
        """
        return self._encoding.encode(text)
