"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""
import re
from typing import Awaitable, Callable, Generic, List, Pattern, TypeVar, Union

from botbuilder.core import TurnContext
from botbuilder.schema import Activity, ActivityTypes, InvokeResponse
from botbuilder.schema.teams import TaskModuleResponse, TaskModuleTaskInfo

from teams.ai import TurnState
from teams.route import Route

StateT = TypeVar("StateT", bound=TurnState)

FETCH_INVOKE_NAME = "task/fetch"
SUBMIT_INVOKE_NAME = "task/submit"


class TaskModules(Generic[StateT]):
    _route_registry: List[Route[StateT]]
    _task_data_filter: str

    def __init__(self, route_registry: List[Route[StateT]], task_data_filter: str) -> None:
        self._route_registry = route_registry
        self._task_data_filter = task_data_filter

    def fetch(self, verb: Union[str, Pattern[str], Callable[[TurnContext], bool]]):
        """
        Adds a route for handling the initial fetch of the task module.
        This method can be used as either a decorator or a method.

        ```python
        # Use this method as a decorator
        @app.task_modules.handle_fetch("buy")
        async def fetch(context: TurnContext, state: TurnState, data: dict):
            print(f"Execute with data: {data}")
            return True

        # Pass a function to this method
        app.adaptive_cards.fetch("buy")(handle_fetch)
        ```

        #### Args:
        - `verb`: a string, regex pattern or a function to match the verb of the request
        """

        # Create route selector for the handler
        def __selector__(context: TurnContext) -> bool:
            return self._task_modules_selector(
                context, verb, self._task_data_filter, FETCH_INVOKE_NAME
            )

        def __call__(
            func: Callable[[TurnContext, StateT, dict], Awaitable[Union[TaskModuleTaskInfo, str]]]
        ):
            async def __handler__(context: TurnContext, state: StateT) -> bool:
                # the selector already ensures data exists
                result = await func(context, state, context.activity.value["data"])
                await self._send_response(context, result)
                return True

            self._route_registry.append(Route[StateT](__selector__, __handler__))
            return func

        return __call__

    def submit(self, verb: Union[str, Pattern[str], Callable[[TurnContext], bool]]):
        """
        Adds a route for handling the submission of a task module.
        This method can be used as either a decorator or a method.

        ```python
        # Use this method as a decorator
        @app.task_modules.submit("confirm")
        async def handle_submit(context: TurnContext, state: TurnState, data: dict):
            print(f"Execute with data: {data}")
            return True

        # Pass a function to this method
        app.adaptive_cards.submit("confirm")(handle_submit)
        ```

        #### Args:
        - `verb`: a string, regex pattern or a function to match the verb of the request
        """

        # Create route selector for the handler
        def __selector__(context: TurnContext) -> bool:
            return self._task_modules_selector(
                context, verb, self._task_data_filter, SUBMIT_INVOKE_NAME
            )

        def __call__(
            func: Callable[
                [TurnContext, StateT, dict], Awaitable[Union[TaskModuleTaskInfo, str, None]]
            ]
        ):
            async def __handler__(context: TurnContext, state: StateT) -> bool:
                # the selector already ensures data exists
                result = await func(context, state, context.activity.value["data"])
                await self._send_response(context, result)
                return True

            self._route_registry.append(Route[StateT](__selector__, __handler__))
            return func

        return __call__

    def _task_modules_selector(
        self,
        context: TurnContext,
        verb: Union[str, Pattern[str], Callable[[TurnContext], bool]],
        filter_field: str,
        invoke_name: str,
    ) -> bool:
        if context.activity.type == ActivityTypes.invoke and context.activity.name == invoke_name:
            data = context.activity.value["data"] if context.activity.value else None
            if isinstance(data, dict) and isinstance(data[filter_field], str) and len(data) == 1:
                # when verb is a function
                if callable(verb):
                    return verb(context)
                # when verb is a regex pattern
                if isinstance(verb, Pattern):
                    hits = re.match(verb, data[filter_field])
                    return hits is not None
                # when verb is a string
                return verb == data[filter_field]

        return False

    async def _send_response(self, context: TurnContext, result):
        if context.turn_state.get(ActivityTypes.invoke_response) is None:
            if isinstance(result, str):
                response = TaskModuleResponse(
                    task={"type": "message", "value": result},
                )
            elif isinstance(result, TaskModuleTaskInfo):
                response = TaskModuleResponse(
                    task={"type": "continue", "value": result},
                )
            else:
                response = None

            await context.send_activity(
                Activity(type="invokeResponse", value=InvokeResponse(status=200, body=response))
            )
