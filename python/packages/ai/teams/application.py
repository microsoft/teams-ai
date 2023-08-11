"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from typing import Awaitable, Callable, Dict, Generic, List, TypeVar

from botbuilder.core import TurnContext
from botbuilder.core.activity_handler import ActivityTypes

from teams.ai import AI, TurnState, TurnStateManager

from .activity import ActivityFunction, ActivityType
from .exception import ApplicationException
from .options import ApplicationOptions

StateT = TypeVar("StateT", bound=TurnState)
StateManagerT = TypeVar("StateManagerT", bound=TurnStateManager)


class Application(Generic[StateT, StateManagerT]):
    """
    Application class for routing and processing incoming requests.

    The Application object replaces the traditional ActivityHandler that
    a bot would use. It supports a simpler fluent style of authoring bots
    versus the inheritance based approach used by the ActivityHandler class.

    Additionally, it has built-in support for calling into the SDK's AI system
    and can be used to create bots that leverage Large Language Models (LLM)
    and other AI capabilities.
    """

    _ai: AI
    _options: ApplicationOptions[StateT, StateManagerT]
    _typing_delay = 1000
    _activities: Dict[ActivityType, ActivityFunction] = {}
    _before_turn: List[ActivityFunction] = []
    _after_turn: List[ActivityFunction] = []

    def __init__(self, options=ApplicationOptions[StateT, StateManagerT]()) -> None:
        """
        Creates a new Application instance.
        """
        self._ai = AI(options.ai) if options.ai else AI()
        self._options = options

        if options.long_running_messages and (not options.adapter or not options.bot_app_id):
            raise ApplicationException(
                """
                The `ApplicationOptions.long_running_messages` property is unavailable because 
                no adapter or `bot_app_id` was configured.
                """
            )

    @property
    def ai(self) -> AI:
        """
        This property is only available if the Application was configured with 'ai' options.
        An exception will be thrown if you attempt to access it otherwise.
        """

        if not self._ai:
            raise ApplicationException(
                """
                The `Application.ai` property is unavailable because no AI options were configured.
                """
            )

        return self._ai

    @property
    def options(self) -> ApplicationOptions[StateT, StateManagerT]:
        """
        The application's configured options.
        """
        return self._options

    def activity(self, activity_type: ActivityType):
        """
        Registers a new activity event listener. This method can be used as either
        a decorator or a method.

        ```python
        # Use this method as a decorator
        @app.activity("event")
        def on_event():
            print("hello world!")

        # Pass a function to this method
        app.action("event")(on_event)
        ```

        #### Args:
        - `activity_type`: The type of the activity
        """

        def __call__(func: ActivityFunction):
            self._activities[activity_type] = func
            return func

        return __call__

    def before_turn(self, func: ActivityFunction):
        self._before_turn.append(func)
        return func

    def after_turn(self, func: ActivityFunction):
        self._after_turn.append(func)
        return func

    def _start_long_running_call(
        self, context: TurnContext, func: Callable[[TurnContext], Awaitable]
    ):
        if (
            self._options.adapter
            and ActivityTypes.message == context.activity.type
            and self._options.long_running_messages
        ):
            return self._options.adapter.continue_conversation(
                bot_id=self._options.bot_app_id,
                reference=context.get_conversation_reference(context.activity),
                callback=func,
            )

        return func(context)
