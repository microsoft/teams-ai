"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from logging import Logger
from typing import Dict, Generic, Optional, TypeVar

from teams.ai.action import ActionEntry, ActionFunction, DefaultActionTypes
from teams.ai.exceptions import AIException
from teams.ai.turn_state import TurnState

from .options import AIOptions

StateT = TypeVar("StateT", bound=TurnState)


class AI(Generic[StateT]):
    """
    ### AI System

    The AI system is responsible for generating plans, moderating input and output, and
    generating prompts. It can be used free standing or routed to by the Application object.
    """

    _options: AIOptions[StateT]
    _log: Logger
    _actions: Dict[str, ActionEntry] = {}

    def __init__(self, options=AIOptions[StateT](), log=Logger("default")) -> None:
        self._options = options
        self._log = log
        self._actions = {}
        self.action(DefaultActionTypes.UNKNOWN_ACTION)(self.__unknown_action__)
        self.action(DefaultActionTypes.FLAGGED_INPUT)(self.__flagged_input__)
        self.action(DefaultActionTypes.FLAGGED_OUTPUT)(self.__flagged_output__)
        self.action(DefaultActionTypes.RATE_LIMITED)(self.__rate_limited__)

    def action(self, name: Optional[str] = None, allow_overrides=False):
        """
        Registers a new action event listener. This method can be used as either
        a decorator or a method.

        ```python
        # Use this method as a decorator
        @app.ai.action()
        def hello_world():
            print("hello world!")

        # Pass a function to this method
        app.ai.action()(hello_world)
        ```

        #### Args:
        - `name`: The name of the action `Default: Function Name`
        - `allow_overrides`: If it should throw an error when duplicates
        are found `Default: False`
        """

        def __call__(func: ActionFunction):
            action_name = name

            if action_name is None:
                action_name = func.__name__

            existing = self._actions.get(action_name)

            if existing is not None and not existing.allow_overrides:
                raise AIException(
                    f"""
                    The AI.action() method was called with a previously 
                    registered action named \"{action_name}\".
                    """
                )

            self._actions[action_name] = ActionEntry(name, allow_overrides, func)
            return func

        return __call__

    def __unknown_action__(self, name: str) -> bool:
        self._log.error(
            """
            An AI action named "%s" was 
            predicted but no handler was registered.
            """,
            name,
        )
        return True

    def __flagged_input__(self) -> bool:
        self._log.error(
            """
            The users input has been moderated but no handler 
            was registered for 'AI.FlaggedInputActionName'.
            """
        )
        return True

    def __flagged_output__(self) -> bool:
        self._log.error(
            """
            The bots output has been moderated but no 
            handler was registered for 'AI.FlaggedOutputActionName'.
            """
        )
        return True

    def __rate_limited__(self) -> bool:
        raise AIException("An AI request failed because it was rate limited")
