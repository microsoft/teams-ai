"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from __future__ import annotations

from typing import Awaitable, Callable, Generic, List, TypeVar, Union, cast

from botbuilder.core import InvokeResponse, TurnContext
from botbuilder.core.serializer_helper import serializer_helper
from botbuilder.schema import Activity, ActivityTypes
from botbuilder.schema.teams import (
    TaskModuleContinueResponse,
    TaskModuleMessageResponse,
    TaskModuleResponse,
    TaskModuleTaskInfo,
)

from teams.route import Route
from teams.state import TurnState

FETCH_INVOKE_NAME = "message/fetchTask"

StateT = TypeVar("StateT", bound=TurnState)


class Messages(Generic[StateT]):
    _routes: List[Route[StateT]] = []

    def __init__(self, routes: List[Route[StateT]]) -> None:
        self._routes = routes

    def fetch_task(self) -> Callable[
        [Callable[[TurnContext, StateT, dict], Awaitable[Union[TaskModuleTaskInfo, str]]]],
        Callable[[TurnContext, StateT, dict], Awaitable[Union[TaskModuleTaskInfo, str]]],
    ]:
        """
        Adds a route for handling the message fetch task activity.
        This method can be used as either a decorator or a method.

        ```python
        # Use this method as a decorator
        @app.messages.fetch_task()
        async def fetch_task(context: TurnContext, state: TurnState, data: dict):
            print(f"Execute with data: {data}")
            return True

        # Pass a function to this method
        app.messages.fetch_task()(fetch_task)
        ```
        """

        # Create route selector for the handler
        def __selector__(context: TurnContext) -> bool:
            return (
                context.activity.type == ActivityTypes.invoke
                and context.activity.name == FETCH_INVOKE_NAME
            )

        def __call__(
            func: Callable[
                [TurnContext, StateT, dict],
                Awaitable[Union[TaskModuleTaskInfo, str]],
            ],
        ) -> Callable[
            [TurnContext, StateT, dict],
            Awaitable[Union[TaskModuleTaskInfo, str]],
        ]:
            async def __invoke__(context: TurnContext, state: StateT):
                res = await func(context, state, cast(dict, context.activity.value))
                await self._invoke_task_response(context, res)
                return True

            self._routes.append(Route[StateT](__selector__, __invoke__, True))
            return func

        return __call__

    async def _invoke_task_response(
        self, context: TurnContext, body: Union[TaskModuleTaskInfo, str]
    ):
        if context._INVOKE_RESPONSE_KEY in context.turn_state:
            return

        response = TaskModuleResponse(task=TaskModuleContinueResponse(value=body))

        if isinstance(body, str):
            response = TaskModuleResponse(task=TaskModuleMessageResponse(value=body))

        await context.send_activity(
            Activity(
                type=ActivityTypes.invoke_response,
                value=InvokeResponse(body=serializer_helper(response), status=200),
            )
        )
