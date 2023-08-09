"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from typing import Any, Awaitable, Callable, Generic, TypeVar, Union

from botbuilder.core import TurnContext

from teams.ai.turn_state import TurnState

StateT = TypeVar("StateT", bound=TurnState)
ReturnT = TypeVar("ReturnT")
ActionFunctionSync = Callable[[TurnContext, TurnState, Any, str], Union[None, bool]]
ActionFunctionAsync = Callable[[TurnContext, TurnState, Any, str], Awaitable[Union[None, bool]]]
ActionFunction = Union[ActionFunctionSync, ActionFunctionAsync]


class ActionEntry(Generic[StateT]):
    name: str
    allow_overrides: bool
    func: ActionFunction

    def __init__(self, name: str, allow_overrides: bool, func: ActionFunction) -> None:
        self.name = name
        self.allow_overrides = allow_overrides
        self.func = func
