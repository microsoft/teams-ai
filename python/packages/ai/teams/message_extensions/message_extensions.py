"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from __future__ import annotations

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
    cast,
)

from botbuilder.core import InvokeResponse, TurnContext
from botbuilder.core.serializer_helper import deserializer_helper, serializer_helper
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

from teams.state import TurnState

from ..route import Route

StateT = TypeVar("StateT", bound=TurnState)
MessagePreviewAction = Literal["edit", "send"]


class MessageExtensions(Generic[StateT]):
    _routes: List[Route[StateT]] = []

    def __init__(self, routes: List[Route[StateT]]) -> None:
        self._routes = routes

    def query(self, command_id: Union[str, Pattern[str]]) -> Callable[
        [
            Callable[
                [TurnContext, StateT, MessagingExtensionQuery],
                Awaitable[MessagingExtensionResult],
            ]
        ],
        Callable[
            [TurnContext, StateT, MessagingExtensionQuery], Awaitable[MessagingExtensionResult]
        ],
    ]:
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
            ):
                return False

            return self._activity_with_command_id(context.activity, command_id)

        def __call__(
            func: Callable[
                [TurnContext, StateT, MessagingExtensionQuery],
                Awaitable[MessagingExtensionResult],
            ],
        ) -> Callable[
            [TurnContext, StateT, MessagingExtensionQuery],
            Awaitable[MessagingExtensionResult],
        ]:
            async def __invoke__(context: TurnContext, state: StateT):
                if not context.activity.value:
                    return False

                value = cast(
                    MessagingExtensionQuery,
                    deserializer_helper(MessagingExtensionQuery, context.activity.value),
                )
                res = await func(context, state, value)
                await self._invoke_response(context, res)
                return True

            self._routes.append(Route[StateT](__selector__, __invoke__, True))
            return func

        return __call__

    def query_link(self, command_id: Union[str, Pattern[str]]) -> Callable[
        [Callable[[TurnContext, StateT, str], Awaitable[MessagingExtensionResult]]],
        Callable[[TurnContext, StateT, str], Awaitable[MessagingExtensionResult]],
    ]:
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
            ):
                return False

            return self._activity_with_command_id(context.activity, command_id)

        def __call__(
            func: Callable[
                [TurnContext, StateT, str],
                Awaitable[MessagingExtensionResult],
            ],
        ) -> Callable[
            [TurnContext, StateT, str],
            Awaitable[MessagingExtensionResult],
        ]:
            async def __invoke__(context: TurnContext, state: StateT):
                if not context.activity.value:
                    return False

                value = cast(
                    AppBasedLinkQuery,
                    deserializer_helper(AppBasedLinkQuery, context.activity.value),
                )

                if not isinstance(value.url, str):
                    return False

                res = await func(context, state, value.url)
                await self._invoke_response(context, res)
                return True

            self._routes.append(Route[StateT](__selector__, __invoke__, True))
            return func

        return __call__

    def anonymous_query_link(self, command_id: Union[str, Pattern[str]]) -> Callable[
        [Callable[[TurnContext, StateT, str], Awaitable[MessagingExtensionResult]]],
        Callable[[TurnContext, StateT, str], Awaitable[MessagingExtensionResult]],
    ]:
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
            ):
                return False

            return self._activity_with_command_id(context.activity, command_id)

        def __call__(
            func: Callable[[TurnContext, StateT, str], Awaitable[MessagingExtensionResult]],
        ) -> Callable[[TurnContext, StateT, str], Awaitable[MessagingExtensionResult]]:
            async def __invoke__(context: TurnContext, state: StateT):
                if not context.activity.value:
                    return False

                value = cast(
                    AppBasedLinkQuery,
                    deserializer_helper(AppBasedLinkQuery, context.activity.value),
                )

                if not isinstance(value.url, str):
                    return False

                res = await func(context, state, value.url)
                await self._invoke_response(context, res)
                return True

            self._routes.append(Route[StateT](__selector__, __invoke__, True))
            return func

        return __call__

    def query_setting_url(
        self,
    ) -> Callable[
        [Callable[[TurnContext, StateT], Awaitable[MessagingExtensionResult]]],
        Callable[[TurnContext, StateT], Awaitable[MessagingExtensionResult]],
    ]:
        """
        Registers a handler that invokes the fetch of the config settings for a Message Extension.

        ```python
        # Use this method as a decorator
        @app.message_extensions.query_setting_url()
        async def on_query_setting_url(context: TurnContext, state: TurnState):
            return MessagingExtensionResult()

        # Pass a function to this method
        app.message_extensions.query_setting_url()(on_query_setting_url)
        ```
        """

        def __selector__(context: TurnContext):
            if (
                context.activity.type != ActivityTypes.invoke
                or context.activity.name != "composeExtension/querySettingUrl"
            ):
                return False
            return True

        def __call__(
            func: Callable[
                [TurnContext, StateT],
                Awaitable[MessagingExtensionResult],
            ],
        ) -> Callable[[TurnContext, StateT], Awaitable[MessagingExtensionResult]]:
            async def __invoke__(context: TurnContext, state: StateT):
                res = await func(context, state)
                await self._invoke_action_response(context, res)
                return True

            self._routes.append(Route[StateT](__selector__, __invoke__, True))
            return func

        return __call__

    def configure_settings(
        self,
    ) -> Callable[
        [Callable[[TurnContext, StateT, Any], Awaitable[None]]],
        Callable[[TurnContext, StateT, Any], Awaitable[None]],
    ]:
        """
        Registers a handler that implements the logic to invoke
            configuring Message Extension settings

        ```python
        # Use this method as a decorator
        @app.message_extensions.configure_settings({"foo": "bar"})
        async def on_configure_settings(context: TurnContext, state: TurnState, data: Any):
            print(data)

        # Pass a function to this method
        app.message_extensions.configure_settings({"foo": "bar"})(on_configure_settings)
        ```
        """

        def __selector__(context: TurnContext):
            if (
                context.activity.type != ActivityTypes.invoke
                or context.activity.name != "composeExtension/setting"
            ):
                return False
            return True

        def __call__(
            func: Callable[[TurnContext, StateT, Any], Awaitable[None]],
        ) -> Callable[[TurnContext, StateT, Any], Awaitable[None]]:
            async def __invoke__(context: TurnContext, state: StateT):
                value = {}
                if context.activity.value:
                    value = context.activity.value

                await func(context, state, value)
                await self._invoke_response(context, MessagingExtensionResult())
                return True

            self._routes.append(Route[StateT](__selector__, __invoke__, True))
            return func

        return __call__

    def card_button_clicked(
        self,
    ) -> Callable[
        [Callable[[TurnContext, StateT, Any], Awaitable[None]]],
        Callable[[TurnContext, StateT, Any], Awaitable[None]],
    ]:
        """
        Registers a handler that implements the logic when a
            user has clicked on a button in a Message Extension card.

        ```python
        # Use this method as a decorator
        @app.message_extensions.card_button_clicked({"foo": "bar"})
        async def on_card_button_clicked(context: TurnContext, state: TurnState, data: Any):
            print(data)

        # Pass a function to this method
        app.message_extensions.card_button_clicked({"foo": "bar"})(on_card_button_clicked)
        ```
        """

        def __selector__(context: TurnContext):
            if (
                context.activity.type != ActivityTypes.invoke
                or context.activity.name != "composeExtension/onCardButtonClicked"
            ):
                return False
            return True

        def __call__(
            func: Callable[[TurnContext, StateT, Any], Awaitable[None]],
        ) -> Callable[[TurnContext, StateT, Any], Awaitable[None]]:
            async def __invoke__(context: TurnContext, state: StateT):
                value = {}
                if context.activity.value:
                    value = context.activity.value

                await func(context, state, value)
                await self._invoke_response(context, MessagingExtensionResult())
                return True

            self._routes.append(Route[StateT](__selector__, __invoke__, True))
            return func

        return __call__

    def message_preview(
        self, command_id: Union[str, Pattern[str]], action: MessagePreviewAction
    ) -> Callable[
        [
            Callable[
                [TurnContext, StateT, Activity],
                Awaitable[Union[MessagingExtensionResult, TaskModuleTaskInfo, str, None]],
            ]
        ],
        Callable[
            [TurnContext, StateT, Activity],
            Awaitable[Union[MessagingExtensionResult, TaskModuleTaskInfo, str, None]],
        ],
    ]:
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

            value = cast(
                MessagingExtensionAction,
                deserializer_helper(MessagingExtensionAction, context.activity.value),
            )
            message_preview_action = value.bot_message_preview_action

            if not isinstance(message_preview_action, str) or message_preview_action != action:
                return False

            return True

        def __call__(
            func: Callable[
                [TurnContext, StateT, Activity],
                Awaitable[Union[MessagingExtensionResult, TaskModuleTaskInfo, str, None]],
            ],
        ) -> Callable[
            [TurnContext, StateT, Activity],
            Awaitable[Union[MessagingExtensionResult, TaskModuleTaskInfo, str, None]],
        ]:
            async def __invoke__(context: TurnContext, state: StateT):
                if not context.activity.value:
                    return False

                value = cast(
                    MessagingExtensionAction,
                    deserializer_helper(MessagingExtensionAction, context.activity.value),
                )

                if (
                    not isinstance(value.bot_activity_preview, list)
                    or len(value.bot_activity_preview) == 0
                ):
                    return False

                res = await func(context, state, value.bot_activity_preview[0])
                await self._invoke_action_response(context, res)
                return True

            self._routes.append(Route[StateT](__selector__, __invoke__, True))
            return func

        return __call__

    def fetch_task(self, command_id: Union[str, Pattern[str]]) -> Callable[
        [Callable[[TurnContext, StateT], Awaitable[Union[TaskModuleTaskInfo, str]]]],
        Callable[[TurnContext, StateT], Awaitable[Union[TaskModuleTaskInfo, str]]],
    ]:
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
            ):
                return False

            return self._activity_with_command_id(context.activity, command_id)

        def __call__(
            func: Callable[
                [TurnContext, StateT],
                Awaitable[Union[TaskModuleTaskInfo, str]],
            ],
        ) -> Callable[
            [TurnContext, StateT],
            Awaitable[Union[TaskModuleTaskInfo, str]],
        ]:
            async def __invoke__(context: TurnContext, state: StateT):
                res = await func(context, state)
                await self._invoke_task_response(context, res)
                return True

            self._routes.append(Route[StateT](__selector__, __invoke__, True))
            return func

        return __call__

    def select_item(
        self,
    ) -> Callable[
        [Callable[[TurnContext, StateT, Any], Awaitable[MessagingExtensionResult]]],
        Callable[[TurnContext, StateT, Any], Awaitable[MessagingExtensionResult]],
    ]:
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
            ],
        ) -> Callable[
            [TurnContext, StateT, Any],
            Awaitable[MessagingExtensionResult],
        ]:
            async def __invoke__(context: TurnContext, state: StateT):
                res = await func(context, state, context.activity.value)
                await self._invoke_action_response(context, res)
                return True

            self._routes.append(Route[StateT](__selector__, __invoke__, True))
            return func

        return __call__

    def submit_action(self, command_id: Union[str, Pattern[str]]) -> Callable[
        [
            Callable[
                [TurnContext, StateT, Any],
                Awaitable[Union[MessagingExtensionResult, TaskModuleTaskInfo, str, None]],
            ]
        ],
        Callable[
            [TurnContext, StateT, Any],
            Awaitable[Union[MessagingExtensionResult, TaskModuleTaskInfo, str, None]],
        ],
    ]:
        """
        Registers a handler that implements the submit action for an
        Action based Message Extension.

        ```python
        # Use this method as a decorator
        @app.message_extensions.submit_action("test")
        async def on_submit_action(context: TurnContext, state: TurnState, data: Any):
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
            ):
                return False

            return self._activity_with_command_id(context.activity, command_id)

        def __call__(
            func: Callable[
                [TurnContext, StateT, Any],
                Awaitable[Union[MessagingExtensionResult, TaskModuleTaskInfo, str, None]],
            ],
        ) -> Callable[
            [TurnContext, StateT, Any],
            Awaitable[Union[MessagingExtensionResult, TaskModuleTaskInfo, str, None]],
        ]:
            async def __invoke__(context: TurnContext, state: StateT):
                if not context.activity.value:
                    return False

                value = cast(
                    MessagingExtensionAction,
                    deserializer_helper(MessagingExtensionAction, context.activity.value),
                )
                res = await func(context, state, value.data)
                await self._invoke_action_response(context, res)
                return True

            self._routes.append(Route[StateT](__selector__, __invoke__, True))
            return func

        return __call__

    def _activity_with_command_id(
        self, activity: Activity, match: Union[str, Pattern[str]]
    ) -> bool:
        value = activity.value if isinstance(activity.value, dict) else vars(activity.value)

        if not "commandId" in value and not "command_id" in value:
            return False

        command_id = value["commandId"] if "commandId" in value else value["command_id"]

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
                type=ActivityTypes.invoke_response,
                value=InvokeResponse(body=serializer_helper(response), status=200),
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
                type=ActivityTypes.invoke_response,
                value=InvokeResponse(body=serializer_helper(response), status=200),
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
                type=ActivityTypes.invoke_response,
                value=InvokeResponse(body=serializer_helper(response), status=200),
            )
        )
