"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from __future__ import annotations

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

from aiohttp.web import Request, Response
from botbuilder.core import Bot, TurnContext
from botbuilder.schema import Activity, ActivityTypes, InvokeResponse
from botbuilder.schema.teams import (
    FileConsentCardResponse,
    O365ConnectorCardActionQuery,
)

from .activity_type import (
    ActivityType,
    ConversationUpdateType,
    MessageReactionType,
    MessageUpdateType,
)
from .adaptive_cards.adaptive_cards import AdaptiveCards
from .ai import AI
from .app_error import ApplicationError
from .app_options import ApplicationOptions
from .auth import AuthManager, OAuth, OAuthOptions
from .meetings.meetings import Meetings
from .message_extensions.message_extensions import MessageExtensions
from .route import Route, RouteHandler
from .state import TurnState
from .task_modules import TaskModules
from .teams_adapter import TeamsAdapter
from .typing import Typing

StateT = TypeVar("StateT", bound=TurnState)
IN_SIGN_IN_KEY = "__InSignInFlow__"


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
    _adaptive_card: AdaptiveCards[StateT]
    _options: ApplicationOptions
    _adapter: Optional[TeamsAdapter] = None
    _auth: Optional[AuthManager[StateT]] = None
    _before_turn: List[RouteHandler[StateT]] = []
    _after_turn: List[RouteHandler[StateT]] = []
    _routes: List[Route[StateT]] = []
    _error: Optional[Callable[[TurnContext, Exception], Awaitable[None]]] = None
    _turn_state_factory: Optional[Callable[[TurnContext], Awaitable[StateT]]] = None
    _message_extensions: MessageExtensions[StateT]
    _task_modules: TaskModules[StateT]
    _meetings: Meetings[StateT]

    def __init__(self, options: ApplicationOptions = ApplicationOptions()) -> None:
        """
        Creates a new Application instance.
        """
        self.typing = Typing()
        self._ai = AI[StateT](options.ai, logger=options.logger) if options.ai else None
        self._options = options
        self._routes = []
        self._message_extensions = MessageExtensions[StateT](self._routes)
        self._adaptive_card = AdaptiveCards[StateT](
            self._routes, options.adaptive_cards.action_submit_filer
        )
        self._task_modules = TaskModules[StateT](
            self._routes, options.task_modules.task_data_filter
        )
        self._meetings = Meetings[StateT](self._routes)

        if options.long_running_messages and (not options.adapter or not options.bot_app_id):
            raise ApplicationError("""
                The `ApplicationOptions.long_running_messages` property is unavailable because 
                no adapter or `bot_app_id` was configured.
                """)

        if options.adapter:
            self._adapter = options.adapter

        if options.auth:
            self._auth = AuthManager[StateT](default=options.auth.default)

            for name, opts in options.auth.settings.items():
                if isinstance(opts, OAuthOptions):
                    self._auth.set(name, OAuth[StateT](opts))

    @property
    def adapter(self) -> TeamsAdapter:
        """
        The bot's adapter.
        """

        if not self._adapter:
            raise ApplicationError("""
                The Application.adapter property is unavailable because it was 
                not configured when creating the Application.
                """)

        return self._adapter

    @property
    def ai(self) -> AI[StateT]:
        """
        This property is only available if the Application was configured with 'ai' options.
        An exception will be thrown if you attempt to access it otherwise.
        """

        if not self._ai:
            raise ApplicationError("""
                The `Application.ai` property is unavailable because no AI options were configured.
                """)

        return self._ai

    @property
    def auth(self) -> AuthManager[StateT]:
        """
        The application's authentication manager
        """
        if not self._auth:
            raise ApplicationError("""
                The `Application.auth` property is unavailable because
                no Auth options were configured.
                """)

        return self._auth

    @property
    def options(self) -> ApplicationOptions:
        """
        The application's configured options.
        """
        return self._options

    @property
    def message_extensions(self) -> MessageExtensions[StateT]:
        """
        Message Extensions
        """
        return self._message_extensions

    @property
    def adaptive_cards(self) -> AdaptiveCards[StateT]:
        """
        Access the application's adaptive cards functionalities.
        """
        return self._adaptive_card

    @property
    def task_modules(self) -> TaskModules[StateT]:
        """
        Access the application's task modules functionalities.
        """
        return self._task_modules

    @property
    def meetings(self) -> Meetings[StateT]:
        """
        Access the application's meetings functionalities.
        """
        return self._meetings

    def activity(
        self, type: ActivityType
    ) -> Callable[[RouteHandler[StateT]], RouteHandler[StateT]]:
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
            return type == context.activity.type

        def __call__(func: RouteHandler[StateT]) -> RouteHandler[StateT]:
            self._routes.append(Route[StateT](__selector__, func))
            return func

        return __call__

    def message(
        self, select: Union[str, Pattern[str]]
    ) -> Callable[[RouteHandler[StateT]], RouteHandler[StateT]]:
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
                text = context.activity.text if context.activity.text else ""
                hits = re.match(select, text)
                return hits is not None

            i = context.activity.text.find(select)
            return i > -1

        def __call__(func: RouteHandler[StateT]) -> RouteHandler[StateT]:
            self._routes.append(Route[StateT](__selector__, func))
            return func

        return __call__

    def conversation_update(
        self, type: ConversationUpdateType
    ) -> Callable[[RouteHandler[StateT]], RouteHandler[StateT]]:
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

        def __call__(func: RouteHandler[StateT]) -> RouteHandler[StateT]:
            self._routes.append(Route[StateT](__selector__, func))
            return func

        return __call__

    def message_reaction(
        self, type: MessageReactionType
    ) -> Callable[[RouteHandler[StateT]], RouteHandler[StateT]]:
        """
        Registers a new message activity event listener. This method can be used as either
        a decorator or a method.

        ```python
        # Use this method as a decorator
        @app.message_reaction("reactionsAdded")
        async def on_reactions_added(context: TurnContext, state: TurnState):
            print("reactions was added!")
            return True

        # Pass a function to this method
        app.message_reaction("reactionsAdded")(on_reactions_added)
        ```

        #### Args:
        - `type`: a string or regex pattern
        """

        def __selector__(context: TurnContext):
            if context.activity.type != ActivityTypes.message_reaction:
                return False

            if type == "reactionsAdded":
                if isinstance(context.activity.reactions_added, List):
                    return len(context.activity.reactions_added) > 0
                return False

            if type == "reactionsRemoved":
                if isinstance(context.activity.reactions_removed, List):
                    return len(context.activity.reactions_removed) > 0
                return False

            return False

        def __call__(func: RouteHandler[StateT]) -> RouteHandler[StateT]:
            self._routes.append(Route[StateT](__selector__, func))
            return func

        return __call__

    def message_update(
        self, type: MessageUpdateType
    ) -> Callable[[RouteHandler[StateT]], RouteHandler[StateT]]:
        """
        Registers a new message activity event listener. This method can be used as either
        a decorator or a method.

        ```python
        # Use this method as a decorator
        @app.message_update("editMessage")
        async def on_edit_message(context: TurnContext, state: TurnState):
            print("message was edited!")
            return True

        # Pass a function to this method
        app.message_update("editMessage")(on_edit_message)
        ```

        #### Args:
        - `type`: a string or regex pattern
        """

        def __selector__(context: TurnContext):
            if type == "editMessage":
                if context.activity.type == ActivityTypes.message_update and isinstance(
                    context.activity.channel_data, dict
                ):
                    data = context.activity.channel_data
                    return data["event_type"] == type
                return False

            if type == "softDeleteMessage":
                if context.activity.type == ActivityTypes.message_delete and isinstance(
                    context.activity.channel_data, dict
                ):
                    data = context.activity.channel_data
                    return data["event_type"] == type
                return False

            if type == "undeleteMessage":
                if context.activity.type == ActivityTypes.message_update and isinstance(
                    context.activity.channel_data, dict
                ):
                    data = context.activity.channel_data
                    return data["event_type"] == type
                return False
            return False

        def __call__(func: RouteHandler[StateT]) -> RouteHandler[StateT]:
            self._routes.append(Route[StateT](__selector__, func))
            return func

        return __call__

    def file_consent_accept(
        self,
    ) -> Callable[
        [Callable[[TurnContext, StateT, FileConsentCardResponse], Awaitable[None]]],
        Callable[[TurnContext, StateT, FileConsentCardResponse], Awaitable[None]],
    ]:
        """
        Registers a handler for when a file consent card is accepted by the user.
         ```python
        # Use this method as a decorator
        @app.file_consent_accept()
        async def on_file_consent_accept(
            context: TurnContext, state: TurnState, file_consent_response: FileConsentCardResponse
        ):
            print(file_consent_response)
        # Pass a function to this method
        app.file_consent_accept()(on_file_consent_accept)
        ```
        """

        def __selector__(context: TurnContext) -> bool:
            return (
                context.activity.type == ActivityTypes.invoke
                and context.activity.name == "fileConsent/invoke"
                and isinstance(context.activity.value, dict)
                and context.activity.value.get("action") == "accept"
            )

        def __call__(
            func: Callable[[TurnContext, StateT, FileConsentCardResponse], Awaitable[None]],
        ) -> Callable[[TurnContext, StateT, FileConsentCardResponse], Awaitable[None]]:
            async def __handler__(context: TurnContext, state: StateT):
                if not context.activity.value:
                    return False
                await func(context, state, context.activity.value)
                return True

            self._routes.append(Route[StateT](__selector__, __handler__, True))
            return func

        return __call__

    def file_consent_decline(
        self,
    ) -> Callable[
        [Callable[[TurnContext, StateT, FileConsentCardResponse], Awaitable[None]]],
        Callable[[TurnContext, StateT, FileConsentCardResponse], Awaitable[None]],
    ]:
        """
        Registers a handler for when a file consent card is declined by the user.
         ```python
        # Use this method as a decorator
        @app.file_consent_decline()
        async def on_file_consent_decline(
            context: TurnContext, state: TurnState, file_consent_response: FileConsentCardResponse
        ):
            print(file_consent_response)
        # Pass a function to this method
        app.file_consent_decline()(on_file_consent_decline)
        ```
        """

        def __selector__(context: TurnContext) -> bool:
            return (
                context.activity.type == ActivityTypes.invoke
                and context.activity.name == "fileConsent/invoke"
                and isinstance(context.activity.value, dict)
                and context.activity.value.get("action") == "decline"
            )

        def __call__(
            func: Callable[[TurnContext, StateT, FileConsentCardResponse], Awaitable[None]],
        ) -> Callable[[TurnContext, StateT, FileConsentCardResponse], Awaitable[None]]:
            async def __handler__(context: TurnContext, state: StateT):
                if not context.activity.value:
                    return False
                await func(context, state, context.activity.value)
                return True

            self._routes.append(Route[StateT](__selector__, __handler__, True))
            return func

        return __call__

    def o365_connector_card_action(
        self,
    ) -> Callable[
        [Callable[[TurnContext, StateT, O365ConnectorCardActionQuery], Awaitable[None]]],
        Callable[[TurnContext, StateT, O365ConnectorCardActionQuery], Awaitable[None]],
    ]:
        """
        Registers a handler for when a O365 connector card action is received from the user.
         ```python
        # Use this method as a decorator
        @app.o365_connector_card_action()
        async def on_o365_connector_card_action(
            context: TurnContext, state: TurnState, query: O365ConnectorCardActionQuery
        ):
            print(query)
        # Pass a function to this method
        app.o365_connector_card_action()(on_o365_connector_card_action)
        ```
        """

        def __selector__(context: TurnContext) -> bool:
            return (
                context.activity.type == ActivityTypes.invoke
                and context.activity.name == "actionableMessage/executeAction"
            )

        def __call__(
            func: Callable[[TurnContext, StateT, O365ConnectorCardActionQuery], Awaitable[None]],
        ) -> Callable[[TurnContext, StateT, O365ConnectorCardActionQuery], Awaitable[None]]:
            async def __handler__(context: TurnContext, state: StateT):
                if not context.activity.value:
                    return False
                await func(context, state, context.activity.value)
                return True

            self._routes.append(Route[StateT](__selector__, __handler__, True))
            return func

        return __call__

    def handoff(
        self,
    ) -> Callable[
        [Callable[[TurnContext, StateT, str], Awaitable[None]]],
        Callable[[TurnContext, StateT, str], Awaitable[None]],
    ]:
        """
        Registers a handler to handoff conversations from one copilot to another.
         ```python
        # Use this method as a decorator
        @app.handoff
        async def on_handoff(
            context: TurnContext, state: TurnState, continuation: str
        ):
            print(query)
        # Pass a function to this method
        app.handoff()(on_handoff)
        ```
        """

        def __selector__(context: TurnContext) -> bool:
            return (
                context.activity.type == ActivityTypes.invoke
                and context.activity.name == "handoff/action"
            )

        def __call__(
            func: Callable[[TurnContext, StateT, str], Awaitable[None]],
        ) -> Callable[[TurnContext, StateT, str], Awaitable[None]]:
            async def __handler__(context: TurnContext, state: StateT):
                if not context.activity.value:
                    return False
                await func(context, state, context.activity.value["continuation"])
                await context.send_activity(
                    Activity(type=ActivityTypes.invoke_response, value=InvokeResponse(status=200))
                )
                return True

            self._routes.append(Route[StateT](__selector__, __handler__, True))
            return func

        return __call__

    def before_turn(self, func: RouteHandler[StateT]) -> RouteHandler[StateT]:
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

    def after_turn(self, func: RouteHandler[StateT]) -> RouteHandler[StateT]:
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

    def error(
        self, func: Callable[[TurnContext, Exception], Awaitable[None]]
    ) -> Callable[[TurnContext, Exception], Awaitable[None]]:
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

    def turn_state_factory(self, func: Callable[[TurnContext], Awaitable[StateT]]):
        """
        Custom Turn State Factory
        """

        self._turn_state_factory = func
        return func

    async def process(self, request: Request) -> Optional[Response]:
        """
        Creates a turn context and runs the middleware pipeline for an incoming activity.
        """

        if not self._adapter:
            raise ApplicationError(
                "cannot call `app.process_activity` when `ApplicationOptions.adapter` not provided"
            )

        return await self._adapter.process(request, self)

    async def on_turn(self, context: TurnContext):
        await self._start_long_running_call(context, self._on_turn)

    async def _on_turn(self, context: TurnContext):
        try:
            await self._start_typing(context)

            self._remove_mentions(context)

            state = await self._initialize_state(context)

            if not await self._authenticate_user(context, state):
                return

            if not await self._run_before_turn_middleware(context, state):
                return

            await self._handle_file_downloads(context, state)

            is_ok, matches = await self._on_activity(context, state)
            if not is_ok:
                await state.save(context, self._options.storage)
                return
            if matches == 0:
                if not await self._run_ai_chain(context, state):
                    return

            if not await self._run_after_turn_middleware(context, state):
                return

            await state.save(context, self._options.storage)
        except ApplicationError as err:
            await self._on_error(context, err)
        finally:
            self.typing.stop()

    async def _start_typing(self, context: TurnContext):
        if self._options.start_typing_timer:
            await self.typing.start(context)

    def _remove_mentions(self, context: TurnContext):
        if self.options.remove_recipient_mention and context.activity.type == ActivityTypes.message:
            context.activity.text = context.remove_recipient_mention(context.activity)

    async def _initialize_state(self, context: TurnContext):
        state = cast(StateT, await TurnState.load(context, self._options.storage))

        if self._turn_state_factory:
            state = await self._turn_state_factory(context)

        await state.load(context, self._options.storage)
        state.temp.input = context.activity.text
        return state

    async def _authenticate_user(self, context: TurnContext, state):
        if self.options.auth and self._auth:
            auth_condition = (
                isinstance(self.options.auth.auto, bool) and self.options.auth.auto
            ) or (callable(self.options.auth.auto) and self.options.auth.auto(context))
            user_in_sign_in = IN_SIGN_IN_KEY in state.user
            if auth_condition or user_in_sign_in:
                key: Optional[str] = state.user.get(IN_SIGN_IN_KEY, self.options.auth.default)

                if key is not None:
                    state.user[IN_SIGN_IN_KEY] = key
                    res = await self._auth.sign_in(context, state, key=key)
                    if res.status == "complete":
                        del state.user[IN_SIGN_IN_KEY]

                    if res.status == "pending":
                        await state.save(context, self._options.storage)
                        return False

                    if res.status == "error" and res.reason != "invalid-activity":
                        del state.user[IN_SIGN_IN_KEY]
                        raise ApplicationError(f"[{res.reason}] => {res.message}")

        return True

    async def _run_before_turn_middleware(self, context: TurnContext, state):
        for before_turn in self._before_turn:
            is_ok = await before_turn(context, state)
            if not is_ok:
                await state.save(context, self._options.storage)
                return False
        return True

    async def _handle_file_downloads(self, context: TurnContext, state):
        if self._options.file_downloaders and len(self._options.file_downloaders) > 0:
            input_files = state.temp.input_files if state.temp.input_files else []
            for file_downloader in self._options.file_downloaders:
                files = await file_downloader.download_files(context)
                input_files.extend(files)
            state.temp.input_files = input_files

    async def _run_ai_chain(self, context: TurnContext, state):
        if (
            self._ai
            and self._options.ai
            and context.activity.type == ActivityTypes.message
            and context.activity.text
        ):
            is_ok = await self._ai.run(context, state)
            if not is_ok:
                await state.save(context, self._options.storage)
                return False
        return True

    async def _run_after_turn_middleware(self, context: TurnContext, state):
        for after_turn in self._after_turn:
            is_ok = await after_turn(context, state)
            if not is_ok:
                await state.save(context, self._options.storage)
                return False
        return True

    async def _on_activity(self, context: TurnContext, state: StateT) -> Tuple[bool, int]:
        matches = 0

        # ensure we handle invokes first
        routes = filter(lambda r: not r.is_invoke and r.selector(context), self._routes)
        invoke_routes = filter(lambda r: r.is_invoke and r.selector(context), self._routes)

        for route in invoke_routes:
            if route.selector(context):
                matches = matches + 1

                if not await route.handler(context, state):
                    return False, matches

        for route in routes:
            if route.selector(context):
                matches = matches + 1

                if not await route.handler(context, state):
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
                bot_app_id=self.options.bot_app_id,
            )

        return await func(context)

    async def _on_error(self, context: TurnContext, err: ApplicationError) -> None:
        if self._error:
            return await self._error(context, err)

        self._options.logger.error(err)
        raise err
