"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from abc import ABC, abstractmethod
from typing import Any, Awaitable, Callable, List

from botbuilder.core import TurnContext

from ...state import Memory
from ..tokenizers import Tokenizer

PromptFunction = Callable[
    [TurnContext, Memory, "PromptFunctions", Tokenizer, List[str]], Awaitable[Any]
]
"""
A function that can be called from a prompt template string.

Parameters:
    context (TurnContext): Context for the current turn of conversation.
    memory (Memory): Interface used to access state variables.
    functions (PromptFunctions): Collection of functions that can be called
      from a prompt template string.
    tokenizer (Tokenizer): Tokenizer used to encode/decode strings.
    args (List[str]): Arguments to the function as an array of strings.

Returns:
    Any: The return type is not specified, so it can be any type.
"""


class PromptFunctions(ABC):
    """A collection of functions that can be called from a prompt template string."""

    @abstractmethod
    def has_function(self, name: str) -> bool:
        """
        Checks if a function is defined.

        Args:
            name (str): Name of the function to lookup.

        Returns:
            bool: True if the function is defined, False otherwise.
        """

    @abstractmethod
    def get_function(self, name: str) -> PromptFunction:
        """
        Looks up a given function.

        Args:
            name (str): Name of the function to lookup.

        Raises:
            Error: If the function is not defined.

        Returns:
            PromptFunction: The function associated with the given name.
        """

    @abstractmethod
    def invoke_function(
        self, name: str, context: TurnContext, memory: Memory, tokenizer: Tokenizer, args: List[str]
    ):
        """
        Calls the given function.

        Args:
            name (str): Name of the function to invoke.
            context (TurnContext): Context for the current turn of conversation.
            memory (Memory): Interface used to access state variables.
            tokenizer (Tokenizer): Tokenizer used to encode/decode strings.
            args (List[str]): Arguments to pass to the function as an array of strings.

        Raises:
            Error: If the function is not defined.
        """
