"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from __future__ import annotations

from typing import Awaitable, Callable, Generic, List, TypeVar

from botbuilder.core import TurnContext
from botbuilder.core.serializer_helper import serializer_helper
from botbuilder.schema import ActivityTypes

from teams.route import Route
from teams.state import TurnState

FETCH_INVOKE_NAME = "message/fetchTask"

StateT = TypeVar("StateT", bound=TurnState)


class Messages(Generic[StateT]):
    _routes: List[Route[StateT]] = []

    def __init__(self, routes: List[Route[StateT]]) -> None:
        self._routes = routes

    def fetch(self) -> Callable[
        [Callable[[TurnContext, StateT, dict], Awaitable[None]]],
        Callable[[TurnContext, StateT, dict], Awaitable[None]],
    ]:
        """
        Adds a route for handling the message fetch task activity.
        This method can be used as either a decorator or a method.

        ```python
        # Use this method as a decorator
        @app.messages.fetch()
        async def fetch(context: TurnContext, state: TurnState, data: dict):
            print(f"Execute with data: {data}")
            return True

        # Pass a function to this method
        app.messages.fetch()(fetch)
        ```
        """

        # Create route selector for the handler
        def __selector__(context: TurnContext) -> bool:
            return (
                context.activity.type == ActivityTypes.invoke
                and context.activity.name == FETCH_INVOKE_NAME
            )

        def __call__(
            func: Callable[[TurnContext, StateT, dict], Awaitable[None]],
        ) -> Callable[[TurnContext, StateT, dict], Awaitable[None]]:
            async def __handler__(context: TurnContext, state: StateT):
                if not context.activity.value:
                    return False
                await func(context, state, context.activity.value)
                return True

            self._routes.append(Route[StateT](__selector__, __handler__))
            return func

        return __call__
