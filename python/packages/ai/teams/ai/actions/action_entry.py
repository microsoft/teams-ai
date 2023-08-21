"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from typing import Any, Awaitable, Callable, Generic, Optional, TypeVar

from botbuilder.core import TurnContext

from teams.ai.state import TurnState

StateT = TypeVar("StateT", bound=TurnState)


class ActionEntry(Generic[StateT]):
    name: str
    allow_overrides: bool
    func: Callable[[TurnContext, StateT, Any, str], Awaitable[bool]]

    def __init__(
        self,
        name: str,
        allow_overrides: bool,
        func: Callable[[TurnContext, StateT, Any, str], Awaitable[bool]],
    ) -> None:
        self.name = name
        self.allow_overrides = allow_overrides
        self.func = func

    async def invoke(
        self, context: TurnContext, state: StateT, entities: Any, name: Optional[str] = None
    ):
        return await self.func(context, state, entities, name or self.name)
