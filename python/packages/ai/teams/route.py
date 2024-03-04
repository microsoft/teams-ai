"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from __future__ import annotations

from typing import Awaitable, Callable, Generic, TypeVar

from botbuilder.core import TurnContext

from .state import TurnState

StateT = TypeVar("StateT", bound=TurnState)
RouteHandler = Callable[[TurnContext, StateT], Awaitable[bool]]


class Route(Generic[StateT]):
    selector: Callable[[TurnContext], bool]
    handler: RouteHandler[StateT]
    is_invoke: bool

    def __init__(
        self,
        selector: Callable[[TurnContext], bool],
        handler: RouteHandler,
        is_invoke: bool = False,
    ) -> None:
        self.selector = selector
        self.handler = handler
        self.is_invoke = is_invoke
