"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

import re
from typing import Awaitable, Callable, Generic, List, Optional, Pattern, TypeVar, Union

from botbuilder.core import Bot, BotFrameworkAdapter, InvokeResponse, TurnContext
from botbuilder.schema import Activity, ActivityTypes

from teams.ai import AI, TurnState

from .activity_type import ActivityType, ConversationUpdateType
from .app_error import ApplicationError
from .app_options import ApplicationOptions
from .route import Route
from .typing_timer import TypingTimer

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

    _ai: Optional[AI[StateT]]
    _options: ApplicationOptions[StateT]
    _adapter: Optional[BotFrameworkAdapter] = None
    _typing_delay = 1000
    _before_turn: List[Callable[[TurnContext, StateT], Awaitable[bool]]] = []
    _after_turn: List[Callable[[TurnContext, StateT], Awaitable[bool]]] = []
    _error: Optional[Callable[[TurnContext, Exception], Awaitable[None]]] = None
    _routes: List[Route[StateT]] = []

    def __init__(self, options=ApplicationOptions[StateT]()) -> None:
        """
        Creates a new Application instance.
        """
        self._ai = AI(options.ai, options.logger) if options.ai else None
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
    def options(self) -> ApplicationOptions[StateT]:
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
        - `activity_type`: The type of the activity
        """

        def __selector__(context: TurnContext):
            return type == str(context.activity.type)

        def __call__(func: Callable[[TurnContext, StateT], Awaitable[bool]]):
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

        def __call__(func: Callable[[TurnContext, StateT], Awaitable[bool]]):
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

        def __call__(func: Callable[[TurnContext, StateT], Awaitable[bool]]):
            self._routes.append(Route[StateT](__selector__, func))
            return func

        return __call__

    def before_turn(self, func: Callable[[TurnContext, StateT], Awaitable[bool]]):
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

    def after_turn(self, func: Callable[[TurnContext, StateT], Awaitable[bool]]):
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
        typing = TypingTimer()

        try:
            await typing.start(context)

            state = await self._options.turn_state_manager.load_state(
                self._options.storage, context
            )

            # run before turn middleware
            for before_turn in self._before_turn:
                is_ok = await before_turn(context, state)
                await self._options.turn_state_manager.save_state(
                    self._options.storage, context, state
                )

                if not is_ok:
                    return

            # run activity handlers
            is_ok = await self._on_activity(context, state)
            await self._options.turn_state_manager.save_state(self._options.storage, context, state)

            if not is_ok:
                return

            if (
                self._ai
                and self._options.ai
                and self._options.ai.prompt
                and context.activity.type == ActivityTypes.message
                and context.activity.text
            ):
                await self._ai.chain(context, state, self._options.ai.prompt)
                await self._options.turn_state_manager.save_state(
                    self._options.storage, context, state
                )

            # run after turn middleware
            for after_turn in self._after_turn:
                is_ok = await after_turn(context, state)
                await self._options.turn_state_manager.save_state(
                    self._options.storage, context, state
                )

                if not is_ok:
                    return

        except ApplicationError as err:
            await self._on_error(context, err)
        finally:
            typing.stop()

    async def _on_activity(self, context: TurnContext, state: StateT):
        for route in self._routes:
            if route.selector(context):
                if not await route.handler(context, state):
                    return False

        return True

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

        raise err
