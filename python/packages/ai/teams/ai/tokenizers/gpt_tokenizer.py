"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from typing import List

from tiktoken import Encoding, get_encoding

from .tokenizer import Tokenizer


class GPTTokenizer(Tokenizer):
    _encoding: Encoding

    def __init__(self):
        self._encoding = get_encoding("cl100k_base")

    def decode(self, tokens: List[int]) -> str:
        return self._encoding.decode(tokens)

    def encode(self, text: str) -> List[int]:
        return self._encoding.encode(text)
