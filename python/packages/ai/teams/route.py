"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from typing import Awaitable, Callable, Generic, TypeVar

from botbuilder.core import TurnContext

from teams.ai.state import TurnState

StateT = TypeVar("StateT", bound=TurnState)


class Route(Generic[StateT]):
    selector: Callable[[TurnContext], bool]
    handler: Callable[[TurnContext, StateT], Awaitable[bool]]

    def __init__(
        self,
        selector: Callable[[TurnContext], bool],
        handler: Callable[[TurnContext, StateT], Awaitable[bool]],
    ) -> None:
        self.selector = selector
        self.handler = handler
