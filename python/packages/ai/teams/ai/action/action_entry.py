"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from typing import Any, Awaitable, Callable, Generic, Optional, TypeVar, Union

from botbuilder.core import TurnContext

from teams.ai.state import TurnState

StateT = TypeVar("StateT", bound=TurnState)
ReturnT = TypeVar("ReturnT")
ActionFunctionSync = Callable[[TurnContext, StateT, Any, str], Optional[bool]]
ActionFunctionAsync = Callable[[TurnContext, StateT, Any, str], Awaitable[Optional[bool]]]
ActionFunction = Union[ActionFunctionSync, ActionFunctionAsync]


class ActionEntry(Generic[StateT]):
    name: str
    allow_overrides: bool
    func: ActionFunction

    def __init__(self, name: str, allow_overrides: bool, func: ActionFunction) -> None:
        self.name = name
        self.allow_overrides = allow_overrides
        self.func = func
