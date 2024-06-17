"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from __future__ import annotations

from typing import Any, Awaitable, Callable, Generic, Optional, TypeVar

from botbuilder.core import TurnContext

from teams.state import TurnState

from .tool_turn_context import ToolTurnContext

StateT = TypeVar("StateT", bound=TurnState)
ToolHandler = Callable[[ToolTurnContext, StateT], Awaitable[str]]


class ToolEntry(Generic[StateT]):
    name: str
    allow_overrides: bool
    func: ToolHandler[StateT]

    def __init__(
        self,
        name: str,
        allow_overrides: bool,
        func: ToolHandler,
    ) -> None:
        self.name = name
        self.allow_overrides = allow_overrides
        self.func = func

    async def invoke(
        self, context: TurnContext, state: StateT, data: Any, name: Optional[str] = None
    ) -> str:
        return await self.func(ToolTurnContext(name or self.name, data, context), state)
