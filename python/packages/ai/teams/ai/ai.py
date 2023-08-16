"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from logging import Logger
from typing import Any, Awaitable, Callable, Dict, Generic, Optional, TypeVar

from botbuilder.core import TurnContext

from teams.ai.action import ActionEntry
from teams.ai.state import TurnState

from .ai_error import AIError
from .ai_options import AIOptions

StateT = TypeVar("StateT", bound=TurnState)


class AI(Generic[StateT]):
    """
    ### AI System

    The AI system is responsible for generating plans, moderating input and output, and
    generating prompts. It can be used free standing or routed to by the Application object.
    """

    _options: AIOptions[StateT]
    _log: Logger
    _actions: Dict[str, ActionEntry[StateT]] = {}

    def __init__(self, options: AIOptions[StateT], log=Logger("teams.ai")) -> None:
        self._options = options
        self._log = log
        self._actions = {}

    def action(self, name: Optional[str] = None, allow_overrides=False):
        """
        Registers a new action event listener. This method can be used as either
        a decorator or a method.

        ```python
        # Use this method as a decorator
        @app.ai.action()
        async def hello_world(context: TurnContext, state: TurnState, entities: Any, name: str):
            print("hello world!")
            return True

        # Pass a function to this method
        app.ai.action()(hello_world)
        ```

        #### Args:
        - `name`: The name of the action `Default: Function Name`
        - `allow_overrides`: If it should throw an error when duplicates
        are found `Default: False`
        """

        def __call__(func: Callable[[TurnContext, StateT, Any, str], Awaitable[bool]]):
            action_name = name

            if action_name is None:
                action_name = func.__name__

            existing = self._actions.get(action_name)

            if existing is not None and not existing.allow_overrides:
                raise AIError(
                    f"""
                    The AI.action() method was called with a previously 
                    registered action named \"{action_name}\".
                    """
                )

            self._actions[action_name] = ActionEntry(action_name, allow_overrides, func)
            return func

        return __call__
