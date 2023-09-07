"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from typing import Any, Awaitable, Callable, Generic, Optional, TypeVar

from botbuilder.core import TurnContext

from teams.ai.state import TurnState

from .action_turn_context import ActionTurnContext

StateT = TypeVar("StateT", bound=TurnState)


class ActionEntry(Generic[StateT]):
    name: str
    allow_overrides: bool
    func: Callable[[ActionTurnContext, StateT], Awaitable[bool]]

    def __init__(
        self,
        name: str,
        allow_overrides: bool,
        func: Callable[[ActionTurnContext, StateT], Awaitable[bool]],
    ) -> None:
        self.name = name
        self.allow_overrides = allow_overrides
        self.func = func

    async def invoke(
        self, context: TurnContext, state: StateT, data: Any, name: Optional[str] = None
    ):
        return await self.func(ActionTurnContext(name or self.name, data, context), state)
