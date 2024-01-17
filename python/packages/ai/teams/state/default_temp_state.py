"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from typing import Any, Dict, List, Optional

from ..input_file import InputFile


class DefaultTempState:
    """Default temp state.

    Inherit a new interface from this base interface to strongly type the applications temp state.
    """

    _dict: Dict[str, Any]

    _INPUT = "input"
    _INPUT_FILES = "input_files"
    _LAST_OUTPUT = "last_output"
    _ACTION_OUTPUTS = "action_outputs"
    _AUTH_TOKENS = "auth_tokens"
    _DUPLICATE_TOKEN_EXCHANGE = "duplicate_token_exchange"

    def __init__(self, data: Dict[str, Any]):
        """Initializes a new instance of the DefaultTempState class.

        Args:
            data (Dict[str, Any]): initial state data.
        """
        self._dict = data

    def get_dict(self) -> Dict[str, Any]:
        """Gets the state data.

        Returns:
            Dict[str, Any]: current state data.
        """
        return self._dict

    @property
    def input(self) -> str:
        """Gets the input value.

        Returns:
            str: the input value.
        """
        return self._dict.get(self._INPUT, "")

    @input.setter
    def input(self, value: str):
        """Sets the input value.

        Args:
            value (str): the input value.
        """
        self._dict[self._INPUT] = value

    @property
    def input_files(self) -> List[InputFile]:
        """Gets the input files.

        Returns:
            List[InputFile]: the input files.
        """
        return self._dict.get(self._INPUT_FILES, [])

    @input_files.setter
    def input_files(self, value: List[InputFile]):
        """Sets the input files.

        Args:
            value (List[InputFile]): the input files.
        """
        self._dict[self._INPUT_FILES] = value

    @property
    def last_output(self) -> str:
        """Gets the last output.

        Returns:
            str: the last output.
        """
        return self._dict.get(self._LAST_OUTPUT, "")

    @last_output.setter
    def last_output(self, value: str):
        """Sets the last output.

        Args:
            value (str): the last output.
        """
        self._dict[self._LAST_OUTPUT] = value

    @property
    def action_outputs(self) -> Dict[str, str]:
        """Gets the action outputs.

        Returns:
            Dict[str, str]: the action outputs.
        """
        return self._dict.get(self._ACTION_OUTPUTS, {})

    @action_outputs.setter
    def action_outputs(self, value: Dict[str, str]):
        """Sets the action outputs.

        Args:
            value (Dict[str, str]): the action outputs.
        """
        self._dict[self._ACTION_OUTPUTS] = value

    @property
    def auth_tokens(self) -> Dict[str, str]:
        """Gets the auth tokens.

        Returns:
            Dict[str, str]: the auth tokens.
        """
        return self._dict.get(self._AUTH_TOKENS, {})

    @auth_tokens.setter
    def auth_tokens(self, value: Dict[str, str]):
        """Sets the auth tokens.

        Args:
            value (Dict[str, str]): the auth tokens.
        """
        self._dict[self._AUTH_TOKENS] = value

    @property
    def duplicate_token_exchange(self) -> Optional[bool]:
        """Gets the duplicate token exchange flag.

        Returns:
            Optional[bool]: the duplicate token exchange flag.
        """
        return self._dict.get(self._DUPLICATE_TOKEN_EXCHANGE, None)

    @duplicate_token_exchange.setter
    def duplicate_token_exchange(self, value: Optional[bool]):
        """Sets the duplicate token exchange flag.

        Args:
            value (Optional[bool]): the duplicate token exchange flag.
        """
        self._dict[self._DUPLICATE_TOKEN_EXCHANGE] = value
