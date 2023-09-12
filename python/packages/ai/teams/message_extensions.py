"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

import re
from typing import (
    Any,
    Awaitable,
    Callable,
    Generic,
    List,
    Literal,
    Pattern,
    TypeVar,
    Union,
)

from botbuilder.core import InvokeResponse, TurnContext
from botbuilder.schema import Activity, ActivityTypes
from botbuilder.schema.teams import (
    AppBasedLinkQuery,
    MessagingExtensionAction,
    MessagingExtensionActionResponse,
    MessagingExtensionQuery,
    MessagingExtensionResponse,
    MessagingExtensionResult,
    TaskModuleContinueResponse,
    TaskModuleMessageResponse,
    TaskModuleResponse,
    TaskModuleTaskInfo,
)

from teams.ai import TurnState

from .route import Route

MessagePreviewAction = Literal["edit", "send"]
StateT = TypeVar("StateT", bound=TurnState)


class MessageExtensions(Generic[StateT]):
    _routes: List[Route[StateT]] = []

    def __init__(self, routes: List[Route[StateT]]) -> None:
        self._routes = routes

    def query(self, command_id: Union[str, Pattern[str]]):
        """
        Registers a handler that implements a Search based Message Extension.

        ```python
        # Use this method as a decorator
        @app.message_extensions.query("test")
        async def on_query(context: TurnContext, state: TurnState, url: str):
            return MessagingExtensionResult()

        # Pass a function to this method
        app.message_extensions.query("test")(on_query)
        ```

        #### Args:
        - `command_id`: a string or regex pattern that matches against the activities
        `command_id`
        """

        def __selector__(context: TurnContext):
            if (
                context.activity.type != ActivityTypes.invoke
                or context.activity.name != "composeExtension/query"
                or not context.activity.value
                or not self._activity_with_command_id(context.activity, command_id)
            ):
                return False

            return True

        def __call__(
            func: Callable[
                [TurnContext, StateT, MessagingExtensionQuery],
                Awaitable[MessagingExtensionResult],
            ]
        ):
            async def __invoke__(context: TurnContext, state: StateT):
                query = context.activity.value

                if not query or not isinstance(query, MessagingExtensionQuery):
                    return False

                res = await func(context, state, query)
                await self._invoke_response(context, res)
                return True

            self._routes.append(Route[StateT](__selector__, __invoke__, True))
            return func

        return __call__

    def query_link(self, command_id: Union[str, Pattern[str]]):
        """
        Registers a handler that implements a Link Unfurling based Message Extension.

        ```python
        # Use this method as a decorator
        @app.message_extensions.query_link("test")
        async def on_query_link(context: TurnContext, state: TurnState, url: str):
            return MessagingExtensionResult()

        # Pass a function to this method
        app.message_extensions.query_link("test")(on_query_link)
        ```

        #### Args:
        - `command_id`: a string or regex pattern that matches against the activities
        `command_id`
        """

        def __selector__(context: TurnContext):
            if (
                context.activity.type != ActivityTypes.invoke
                or context.activity.name != "composeExtension/queryLink"
                or not context.activity.value
                or not self._activity_with_command_id(context.activity, command_id)
            ):
                return False

            return True

        def __call__(
            func: Callable[
                [TurnContext, StateT, str],
                Awaitable[MessagingExtensionResult],
            ]
        ):
            async def __invoke__(context: TurnContext, state: StateT):
                if not context.activity.value or not isinstance(
                    context.activity.value, AppBasedLinkQuery
                ):
                    return False

                if not isinstance(context.activity.value.url, str):
                    return False

                res = await func(context, state, context.activity.value.url)
                await self._invoke_response(context, res)
                return True

            self._routes.append(Route[StateT](__selector__, __invoke__, True))
            return func

        return __call__

    def anonymous_query_link(self, command_id: Union[str, Pattern[str]]):
        """
        Registers a handler for a command that performs anonymous link unfurling.

        ```python
        # Use this method as a decorator
        @app.message_extensions.anonymous_query_link("test")
        async def on_anonymous_query_link(context: TurnContext, state: TurnState, url: str):
            print(url)
            return MessageExtensionResult()

        # Pass a function to this method
        app.message_extensions.anonymous_query_link("test")(on_anonymous_query_link)
        ```

        #### Args:
        - `command_id`: a string or regex pattern that matches against the activities
        `command_id`
        """

        def __selector__(context: TurnContext):
            if (
                context.activity.type != ActivityTypes.invoke
                or context.activity.name != "composeExtension/anonymousQueryLink"
                or not context.activity.value
            ):
                return False

            return self._activity_with_command_id(context.activity, command_id)

        def __call__(
            func: Callable[[TurnContext, StateT, str], Awaitable[MessagingExtensionResult]]
        ):
            async def __invoke__(context: TurnContext, state: StateT):
                if not context.activity.value or not isinstance(
                    context.activity.value, AppBasedLinkQuery
                ):
                    return False

                if not isinstance(context.activity.value.url, str):
                    return False

                res = await func(context, state, context.activity.value.url)
                await self._invoke_response(context, res)
                return True

            self._routes.append(Route[StateT](__selector__, __invoke__, True))
            return func

        return __call__

    def message_preview(self, command_id: Union[str, Pattern[str]], action: MessagePreviewAction):
        """
        Registers a handler to process an action of a message that's being
        previewed by the user prior to sending.

        ```python
        # Use this method as a decorator
        @app.message_extensions.message_preview("test", "edit")
        async def on_message_preview_edit(
            context: TurnContext,
            state: TurnState,
            activity: Activity,
        ):
            return

        # Pass a function to this method
        app.message_extensions.message_preview("test", "edit")(on_message_preview_edit)
        ```

        #### Args:
        - `command_id`: a string or regex pattern that matches against the activities
        `command_id`
        - `action`: the action to subscribe to
        """

        def __selector__(context: TurnContext):
            if (
                context.activity.type != ActivityTypes.invoke
                or context.activity.name != "composeExtension/submitAction"
                or not context.activity.value
                or not self._activity_with_command_id(context.activity, command_id)
            ):
                return False

            message_preview_action = None

            if isinstance(context.activity.value, MessagingExtensionAction):
                message_preview_action = context.activity.value.bot_message_preview_action

            if not isinstance(message_preview_action, str) or message_preview_action != action:
                return False

            return True

        def __call__(
            func: Callable[
                [TurnContext, StateT, Activity],
                Awaitable[Union[MessagingExtensionResult, TaskModuleTaskInfo, str, None]],
            ]
        ):
            async def __invoke__(context: TurnContext, state: StateT):
                if not context.activity.value:
                    return False

                value = vars(context.activity.value)

                if not "bot_activity_preview" in value or not isinstance(
                    value["bot_activity_preview"], list
                ):
                    return False

                res = await func(context, state, value["bot_activity_preview"][0])
                await self._invoke_action_response(context, res)
                return True

            self._routes.append(Route[StateT](__selector__, __invoke__, True))
            return func

        return __call__

    def fetch_task(self, command_id: Union[str, Pattern[str]]):
        """
        Registers a handler to process the initial fetch task for an
        Action based message extension.

        ```python
        # Use this method as a decorator
        @app.message_extensions.fetch_task("test")
        async def on_fetch_task(context: TurnContext, state: TurnState):
            return TaskModuleTaskInfo()

        # Pass a function to this method
        app.message_extensions.fetch_task("test")(on_fetch_task)
        ```

        #### Args:
        - `command_id`: a string or regex pattern that matches against the activities
        `command_id`
        """

        def __selector__(context: TurnContext):
            if (
                context.activity.type != ActivityTypes.invoke
                or context.activity.name != "composeExtension/fetchTask"
                or not context.activity.value
                or not self._activity_with_command_id(context.activity, command_id)
            ):
                return False

            return True

        def __call__(
            func: Callable[
                [TurnContext, StateT],
                Awaitable[Union[TaskModuleTaskInfo, str]],
            ]
        ):
            async def __invoke__(context: TurnContext, state: StateT):
                res = await func(context, state)
                await self._invoke_task_response(context, res)
                return True

            self._routes.append(Route[StateT](__selector__, __invoke__, True))
            return func

        return __call__

    def select_item(self):
        """
        Registers a handler that implements the logic to handle the
        tap actions for items returned by a Search based message extension.

        ```python
        # Use this method as a decorator
        @app.message_extensions.select_item
        async def on_select_item(context: TurnContext, state: TurnState, item: Any):
            return MessagingExtensionResult()

        # Pass a function to this method
        app.message_extensions.select_item()(on_select_item)
        ```
        """

        def __selector__(context: TurnContext):
            if (
                context.activity.type != ActivityTypes.invoke
                or context.activity.name != "composeExtension/selectItem"
            ):
                return False

            return True

        def __call__(
            func: Callable[
                [TurnContext, StateT, Any],
                Awaitable[MessagingExtensionResult],
            ]
        ):
            async def __invoke__(context: TurnContext, state: StateT):
                res = await func(context, state, context.activity.value)
                await self._invoke_action_response(context, res)
                return True

            self._routes.append(Route[StateT](__selector__, __invoke__, True))
            return func

        return __call__

    def submit_action(self, command_id: Union[str, Pattern[str]]):
        """
        Registers a handler that implements the submit action for an
        Action based Message Extension.

        ```python
        # Use this method as a decorator
        @app.message_extensions.submit_action("test")
        async def on_submit_action(context: TurnContext, state: TurnState, value: Any):
            return TaskModuleTaskInfo()

        # Pass a function to this method
        app.message_extensions.submit_action("test")(on_submit_action)
        ```

        #### Args:
        - `command_id`: a string or regex pattern that matches against the activities
        `command_id`
        """

        def __selector__(context: TurnContext):
            if (
                context.activity.type != ActivityTypes.invoke
                or context.activity.name != "composeExtension/submitAction"
                or not context.activity.value
                or not self._activity_with_command_id(context.activity, command_id)
            ):
                return False

            return True

        def __call__(
            func: Callable[
                [TurnContext, StateT, Any],
                Awaitable[Union[MessagingExtensionResult, TaskModuleTaskInfo, str, None]],
            ]
        ):
            async def __invoke__(context: TurnContext, state: StateT):
                res = await func(context, state, context.activity.value)
                await self._invoke_action_response(context, res)
                return True

            self._routes.append(Route[StateT](__selector__, __invoke__, True))
            return func

        return __call__

    def _activity_with_command_id(
        self, activity: Activity, match: Union[str, Pattern[str]]
    ) -> bool:
        command_id = None

        if isinstance(activity.value, object):
            command_id = getattr(activity.value, "command_id")

        if not isinstance(command_id, str):
            return False

        if isinstance(match, Pattern):
            hits = re.match(match, command_id)
            return hits is not None

        return command_id == match

    async def _invoke_response(self, context: TurnContext, body: MessagingExtensionResult):
        if context._INVOKE_RESPONSE_KEY in context.turn_state:
            return

        response = MessagingExtensionResponse(compose_extension=body)

        await context.send_activity(
            Activity(
                type=ActivityTypes.invoke_response, value=InvokeResponse(body=response, status=200)
            )
        )

    async def _invoke_action_response(
        self,
        context: TurnContext,
        body: Union[MessagingExtensionResult, TaskModuleTaskInfo, str, None] = None,
    ):
        if context._INVOKE_RESPONSE_KEY in context.turn_state:
            return

        response = MessagingExtensionActionResponse()

        if isinstance(body, str):
            response = MessagingExtensionActionResponse(
                task=TaskModuleMessageResponse(
                    value=body,
                )
            )
        elif isinstance(body, TaskModuleTaskInfo):
            response = MessagingExtensionActionResponse(task=TaskModuleContinueResponse(value=body))
        elif isinstance(body, MessagingExtensionResult):
            response = MessagingExtensionActionResponse(compose_extension=body)

        await context.send_activity(
            Activity(
                type=ActivityTypes.invoke_response, value=InvokeResponse(body=response, status=200)
            )
        )

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
                type=ActivityTypes.invoke_response, value=InvokeResponse(body=response, status=200)
            )
        )
