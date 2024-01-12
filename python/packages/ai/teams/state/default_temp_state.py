"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from typing import Any, Dict, List, Optional

from ..input_file import InputFile


class DefaultTempState:
    _dict: Dict[str, Any]

    INPUT = "input"
    INPUT_FILES = "input_files"
    LAST_OUTPUT = "last_output"
    ACTION_OUTPUTS = "action_outputs"
    AUTH_TOKENS = "auth_tokens"
    DUPLICATE_TOKEN_EXCHANGE = "duplicate_token_exchange"

    def __init__(self, data: Dict[str, Any]):
        self._dict = data

    def get_dict(self) -> Dict[str, Any]:
        return self._dict

    @property
    def input(self) -> str:
        return self._dict.get(self.INPUT, "")

    @input.setter
    def input(self, value: str):
        self._dict[self.INPUT] = value

    @property
    def input_files(self) -> List[InputFile]:
        return self._dict.get(self.INPUT_FILES, [])

    @input_files.setter
    def input_files(self, value: List[InputFile]):
        self._dict[self.INPUT_FILES] = value

    @property
    def last_output(self) -> str:
        return self._dict.get(self.LAST_OUTPUT, "")

    @last_output.setter
    def last_output(self, value: str):
        self._dict[self.LAST_OUTPUT] = value

    @property
    def action_outputs(self) -> Dict[str, str]:
        return self._dict.get(self.ACTION_OUTPUTS, {})

    @action_outputs.setter
    def action_outputs(self, value: Dict[str, str]):
        self._dict[self.ACTION_OUTPUTS] = value

    @property
    def auth_tokens(self) -> Dict[str, str]:
        return self._dict.get(self.AUTH_TOKENS, {})

    @auth_tokens.setter
    def auth_tokens(self, value: Dict[str, str]):
        self._dict[self.AUTH_TOKENS] = value

    @property
    def duplicate_token_exchange(self) -> Optional[bool]:
        return self._dict.get(self.DUPLICATE_TOKEN_EXCHANGE, None)

    @duplicate_token_exchange.setter
    def duplicate_token_exchange(self, value: Optional[bool]):
        self._dict[self.DUPLICATE_TOKEN_EXCHANGE] = value
