"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from typing import Generic, TypeVar

from teams.ai import AI, TurnState, TurnStateManager

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
    _typing_delay = 1000

    def __init__(self, options=ApplicationOptions()) -> None:
        """
        Creates a new Application instance.
        """
        self._ai = AI(options.ai)

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
