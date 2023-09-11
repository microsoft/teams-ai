"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

import re
from typing import (
    Awaitable,
    Callable,
    Generic,
    List,
    Optional,
    Pattern,
    Tuple,
    TypeVar,
    Union,
    cast,
)

from botbuilder.core import Bot, BotFrameworkAdapter, InvokeResponse, TurnContext
from botbuilder.schema import Activity, ActivityTypes
from botbuilder.schema.teams import (
    MessagingExtensionActionResponse,
    MessagingExtensionResult,
    TaskModuleResponseBase,
    TaskModuleTaskInfo,
)

from teams.ai import AI, TurnState

from .activity_type import ActivityType, ConversationUpdateType
from .app_error import ApplicationError
from .app_options import ApplicationOptions
from .message_preview_action import MessagePreviewAction
from .route import Route, RouteHandler
from .typing import Typing

StateT = TypeVar("StateT", bound=TurnState)


class Application(Bot, Generic[StateT]):
    """
    Application class for routing and processing incoming requests.

    The Application object replaces the traditional ActivityHandler that
    a bot would use. It supports a simpler fluent style of authoring bots
    versus the inheritance based approach used by the ActivityHandler class.

    Additionally, it has built-in support for calling into the SDK's AI system
    and can be used to create bots that leverage Large Language Models (LLM)
    and other AI capabilities.
    """

    typing: Typing

    _ai: Optional[AI[StateT]]
    _options: ApplicationOptions
    _adapter: Optional[BotFrameworkAdapter] = None
    _before_turn: List[RouteHandler[StateT]] = []
    _after_turn: List[RouteHandler[StateT]] = []
    _routes: List[Route[StateT]] = []
    _error: Optional[Callable[[TurnContext, Exception], Awaitable[None]]] = None
    _turn_state_factory: Optional[Callable[[Activity], Awaitable[StateT]]] = None

    def __init__(self, options=ApplicationOptions()) -> None:
        """
        Creates a new Application instance.
        """
        self.typing = Typing()
        self._ai = AI(options.ai, log=options.logger) if options.ai else None
        self._options = options
        self._routes = []

        if options.long_running_messages and (not options.auth or not options.bot_app_id):
            raise ApplicationError(
                """
                The `ApplicationOptions.long_running_messages` property is unavailable because 
                no adapter or `bot_app_id` was configured.
                """
            )

        if options.auth:
            self._adapter = BotFrameworkAdapter(options.auth)

    @property
    def ai(self) -> AI[StateT]:
        """
        This property is only available if the Application was configured with 'ai' options.
        An exception will be thrown if you attempt to access it otherwise.
        """

        if not self._ai:
            raise ApplicationError(
                """
                The `Application.ai` property is unavailable because no AI options were configured.
                """
            )

        return self._ai

    @property
    def options(self) -> ApplicationOptions:
        """
        The application's configured options.
        """
        return self._options

    def activity(self, type: ActivityType):
        """
        Registers a new activity event listener. This method can be used as either
        a decorator or a method.

        ```python
        # Use this method as a decorator
        @app.activity("event")
        async def on_event(context: TurnContext, state: TurnState):
            print("hello world!")
            return True

        # Pass a function to this method
        app.action("event")(on_event)
        ```

        #### Args:
        - `type`: The type of the activity
        """

        def __selector__(context: TurnContext):
            return type == str(context.activity.type)

        def __call__(func: RouteHandler[StateT]):
            self._routes.append(Route[StateT](__selector__, func))
            return func

        return __call__

    def message(self, select: Union[str, Pattern[str]]):
        """
        Registers a new message activity event listener. This method can be used as either
        a decorator or a method.

        ```python
        # Use this method as a decorator
        @app.message("hi")
        async def on_hi_message(context: TurnContext, state: TurnState):
            print("hello!")
            return True

        # Pass a function to this method
        app.message("hi")(on_hi_message)
        ```

        #### Args:
        - `select`: a string or regex pattern
        """

        def __selector__(context: TurnContext):
            if context.activity.type != ActivityTypes.message:
                return False

            if isinstance(select, Pattern):
                hits = re.match(select, context.activity.text)
                return hits is not None

            i = context.activity.text.find(select)
            return i > -1

        def __call__(func: RouteHandler[StateT]):
            self._routes.append(Route[StateT](__selector__, func))
            return func

        return __call__

    def conversation_update(self, type: ConversationUpdateType):
        """
        Registers a new message activity event listener. This method can be used as either
        a decorator or a method.

        ```python
        # Use this method as a decorator
        @app.conversation_update("channelCreated")
        async def on_channel_created(context: TurnContext, state: TurnState):
            print("a new channel was created!")
            return True

        # Pass a function to this method
        app.conversation_update("channelCreated")(on_channel_created)
        ```

        #### Args:
        - `type`: a string or regex pattern
        """

        def __selector__(context: TurnContext):
            if context.activity.type != ActivityTypes.conversation_update:
                return False

            if type == "membersAdded":
                if isinstance(context.activity.members_added, List):
                    return len(context.activity.members_added) > 0
                return False

            if type == "membersRemoved":
                if isinstance(context.activity.members_removed, List):
                    return len(context.activity.members_removed) > 0
                return False

            if isinstance(context.activity.channel_data, object):
                data = vars(context.activity.channel_data)
                return data["event_type"] == type

            return False

        def __call__(func: RouteHandler[StateT]):
            self._routes.append(Route[StateT](__selector__, func))
            return func

        return __call__

    def anonymous_query_link(self, command_id: Union[str, Pattern[str]]):
        """
        Registers a handler for a command that performs anonymous link unfurling.

        ```python
        # Use this method as a decorator
        @app.anonymous_query_link("test")
        async def on_anonymous_query_link(context: TurnContext, state: TurnState, url: str):
            print(url)
            return True

        # Pass a function to this method
        app.anonymous_query_link("test")(on_anonymous_query_link)
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
                if not context.activity.value:
                    return False

                value = vars(context.activity.value)

                if not "url" in value or not isinstance(value["url"], str):
                    return False

                res = await func(context, state, value["url"])
                await self._invoke_response(context, res)
                return True

            self._routes.append(Route[StateT](__selector__, __invoke__))
            return func

        return __call__

    def message_preview(self, command_id: Union[str, Pattern[str]], action: MessagePreviewAction):
        """
        Registers a handler to process an action of a message that's being
        previewed by the user prior to sending.

        ```python
        # Use this method as a decorator
        @app.message_preview("test", "edit")
        async def on_message_preview_edit(context: TurnContext, state: TurnState):
            return True

        # Pass a function to this method
        app.message_preview("test", "edit")(on_message_preview_edit)
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

            if isinstance(context.activity.value, object):
                message_preview_action = getattr(
                    context.activity.value, "bot_message_preview_action"
                )

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
                await self._invoke_response(context, res)
                return True

            self._routes.append(Route[StateT](__selector__, __invoke__))
            return func

        return __call__

    def before_turn(self, func: RouteHandler[StateT]):
        """
        Registers a new event listener that will be executed before turns.
        This method can be used as either a decorator or a method and
        is called in the order they are registered.

        ```python
        # Use this method as a decorator
        @app.before_turn
        async def on_before_turn(context: TurnContext, state: TurnState):
            print("hello world!")
            return True

        # Pass a function to this method
        app.before_turn(on_before_turn)
        ```
        """

        self._before_turn.append(func)
        return func

    def after_turn(self, func: RouteHandler[StateT]):
        """
        Registers a new event listener that will be executed after turns.
        This method can be used as either a decorator or a method and
        is called in the order they are registered.

        ```python
        # Use this method as a decorator
        @app.after_turn
        async def on_after_turn(context: TurnContext, state: TurnState):
            print("hello world!")
            return True

        # Pass a function to this method
        app.after_turn(on_after_turn)
        ```
        """

        self._after_turn.append(func)
        return func

    def error(self, func: Callable[[TurnContext, Exception], Awaitable[None]]):
        """
        Registers an error handler that will be called anytime
        the app throws an Exception

        ```python
        # Use this method as a decorator
        @app.error
        async def on_error(context: TurnContext, err: Exception):
            print(err.message)

        # Pass a function to this method
        app.error(on_error)
        ```
        """

        self._error = func

        if self._adapter:
            self._adapter.on_turn_error = func

        return func

    def turn_state_factory(self, func: Callable[[Activity], Awaitable[StateT]]):
        """
        Custom Turn State Factory
        """

        self._turn_state_factory = func
        return func

    async def process_activity(
        self, activity: Activity, auth_header: str
    ) -> Optional[InvokeResponse]:
        """
        Creates a turn context and runs the middleware pipeline for an incoming activity.

        :param activity: The incoming activity
        :type activity: :class:`Activity`
        :param auth_header: The HTTP authentication header of the request
        :type auth_header: :class:`typing.str`

        :return: A task that represents the work queued to execute.

        .. remarks::
            This class processes an activity received by the bots web server. This includes any
            messages sent from a user and is the method that drives what's often referred to as the
            bots *reactive messaging* flow.
            Call this method to reactively send a message to a conversation.
            If the task completes successfully, then an :class:`InvokeResponse` is returned;
            otherwise. `null` is returned.
        """

        if not self._adapter:
            raise ApplicationError(
                "cannot call `app.process_activity` when `ApplicationOptions.adapter` not provided"
            )

        return await self._adapter.process_activity(activity, auth_header, self.on_turn)

    async def on_turn(self, context: TurnContext):
        await self._start_long_running_call(context, self._on_turn)

    async def _on_turn(self, context: TurnContext):
        try:
            if self._options.start_typing_timer:
                await self.typing.start(context)

            state: TurnState

            if self._turn_state_factory:
                state = await self._turn_state_factory(context.activity)
            else:
                state = await self._load_state(context.activity)

            # run before turn middleware
            for before_turn in self._before_turn:
                is_ok = await before_turn(context, cast(StateT, state))

                if not is_ok:
                    if self._options.storage:
                        await state.save(self._options.storage)
                    return

            # run activity handlers
            is_ok, matches = await self._on_activity(context, state)

            if not is_ok:
                if self._options.storage:
                    await state.save(self._options.storage)
                return

            # only run chain when no activity handlers matched
            if (
                matches == 0
                and self._ai
                and self._options.ai
                and self._options.ai.prompt
                and context.activity.type == ActivityTypes.message
                and context.activity.text
            ):
                is_ok = await self._ai.chain(context, cast(StateT, state), self._options.ai.prompt)

                if not is_ok:
                    if self._options.storage:
                        await state.save(self._options.storage)
                    return

            # run after turn middleware
            for after_turn in self._after_turn:
                is_ok = await after_turn(context, cast(StateT, state))

                if not is_ok:
                    if self._options.storage:
                        await state.save(self._options.storage)
                    return

            if self._options.storage:
                await state.save(self._options.storage)

        except ApplicationError as err:
            await self._on_error(context, err)
        finally:
            self.typing.stop()

    async def _on_activity(self, context: TurnContext, state: TurnState) -> Tuple[bool, int]:
        matches = 0

        for route in self._routes:
            if route.selector(context):
                matches = matches + 1

                if not await route.handler(context, cast(StateT, state)):
                    return False, matches

        return True, matches

    async def _start_long_running_call(
        self, context: TurnContext, func: Callable[[TurnContext], Awaitable]
    ):
        if (
            self._adapter
            and ActivityTypes.message == context.activity.type
            and self._options.long_running_messages
        ):
            return await self._adapter.continue_conversation(
                reference=context.get_conversation_reference(context.activity),
                callback=func,
            )

        return await func(context)

    async def _on_error(self, context: TurnContext, err: ApplicationError) -> None:
        if self._error:
            return await self._error(context, err)

        self._options.logger.error(err)
        raise err

    async def _load_state(self, activity: Activity) -> TurnState:
        return await TurnState.from_activity(activity, self._options.storage)

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

    async def _invoke_response(
        self,
        context: TurnContext,
        body: Union[MessagingExtensionResult, TaskModuleTaskInfo, str, None] = None,
    ):
        if context._INVOKE_RESPONSE_KEY in context.turn_state:
            return

        response = MessagingExtensionActionResponse()

        if isinstance(body, str):
            response = MessagingExtensionActionResponse(
                task=TaskModuleResponseBase(
                    type="message",
                    value=body,
                )
            )
        elif isinstance(body, TaskModuleTaskInfo):
            response = MessagingExtensionActionResponse(
                task=TaskModuleResponseBase(type="continue", value=body)
            )
        elif isinstance(body, MessagingExtensionResult):
            response = MessagingExtensionActionResponse(compose_extension=body)

        await context.send_activity(
            Activity(
                type=ActivityTypes.invoke_response, value=InvokeResponse(body=response, status=200)
            )
        )
