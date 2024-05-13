"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from __future__ import annotations

from typing import Awaitable, Callable, Generic, List, TypeVar

from botbuilder.core import TurnContext
from botbuilder.schema import ActivityTypes
from botbuilder.schema.teams import MeetingEndEventDetails, MeetingStartEventDetails

from ..route import Route
from ..state import TurnState

StateT = TypeVar("StateT", bound=TurnState)


class Meetings(Generic[StateT]):
    _routes: List[Route[StateT]] = []

    def __init__(self, routes: List[Route[StateT]]) -> None:
        self._routes = routes

    def start(
        self,
    ) -> Callable[
        [Callable[[TurnContext, StateT, MeetingStartEventDetails], Awaitable[None]]],
        Callable[[TurnContext, StateT, MeetingStartEventDetails], Awaitable[None]],
    ]:
        """
        Registers a handler for meeting start events for Microsoft Teams.

         ```python
        # Use this method as a decorator
        @app.meetings.start()
        async def on_start(
            context: TurnContext, state: TurnState, meeting: MeetingStartEventDetails
        ):
            print(meeting)

        # Pass a function to this method
        app.meetings.start()(on_start)
        ```
        """

        def __selector__(context: TurnContext) -> bool:
            return (
                context.activity.type == ActivityTypes.event
                and context.activity.channel_id == "msteams"
                and context.activity.name == "application/vnd.microsoft.meetingStart"
            )

        def __call__(
            func: Callable[[TurnContext, StateT, MeetingStartEventDetails], Awaitable[None]],
        ) -> Callable[[TurnContext, StateT, MeetingStartEventDetails], Awaitable[None]]:
            async def __handler__(context: TurnContext, state: StateT):
                if not context.activity.value:
                    return False
                await func(context, state, context.activity.value)
                return True

            self._routes.append(Route[StateT](__selector__, __handler__))
            return func

        return __call__

    def end(
        self,
    ) -> Callable[
        [Callable[[TurnContext, StateT, MeetingEndEventDetails], Awaitable[None]]],
        Callable[[TurnContext, StateT, MeetingEndEventDetails], Awaitable[None]],
    ]:
        """
        Registers a handler for meeting end events for Microsoft Teams.

         ```python
        # Use this method as a decorator
        @app.meetings.end()
        async def on_end(context: TurnContext, state: TurnState, meeting: MeetingEndEventDetails):
            print(meeting)

        # Pass a function to this method
        app.meetings.end()(on_end)
        ```
        """

        def __selector__(context: TurnContext) -> bool:
            return (
                context.activity.type == ActivityTypes.event
                and context.activity.channel_id == "msteams"
                and context.activity.name == "application/vnd.microsoft.meetingEnd"
            )

        def __call__(
            func: Callable[[TurnContext, StateT, MeetingEndEventDetails], Awaitable[None]],
        ) -> Callable[[TurnContext, StateT, MeetingEndEventDetails], Awaitable[None]]:
            async def __handler__(context: TurnContext, state: StateT):
                if not context.activity.value:
                    return False
                await func(context, state, context.activity.value)
                return True

            self._routes.append(Route(__selector__, __handler__))
            return func

        return __call__
