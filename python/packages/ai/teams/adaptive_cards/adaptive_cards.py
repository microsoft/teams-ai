"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""
from typing import List, TypeVar, Union, Pattern,Callable, Awaitable, Generic, Any
from teams.route import Route
from teams.ai import TurnState
from botbuilder.core import TurnContext
from botbuilder.schema import ActivityTypes, AdaptiveCardInvokeResponse, InvokeResponse
import re

StateT = TypeVar("StateT", bound=TurnState)

ACTION_INVOKE_NAME = "adaptiveCard/action"
ACTION_EXECUTE_TYPE = "Action.Execute"

class AdaptiveCards(Generic[StateT]):
    _route_registry: List[Route[StateT]]

    def __init__(self, route_registry: List[Route[StateT]]) -> None:
        self._route_registry = route_registry

    def action_execute(self, verb: Union[str, Pattern[str], Callable[[TurnContext], bool]]):
        """
        Registers a new adaptive card execute event listener. This method can be used as either
        a decorator or a method.

        ```python
        # Use this method as a decorator
        @app.adaptive_cards.action_execute("do")
        async def execute_do(context: TurnContext, state: TurnState, data: Any):
            print(f"Execute with data: {data}")
            return True

        # Pass a function to this method
        app.adaptive_cards.action_execute("do")(execute_do)
        ```

        #### Args:
        - `verb`: a string, regex pattern or a function to match the verb of the action
        """

        # Create route selector for the handler
        def __selector__(context: TurnContext) -> bool:
            if context.activity.type == ActivityTypes.invoke and context.activity.name == ACTION_INVOKE_NAME:
                action = context.activity.value.action if context.activity.value else None
                action_type = action.type if action else None
                action_verb = action.verb if action else None
                if action_type == ACTION_EXECUTE_TYPE:
                    # when verb is a function
                    if callable(verb):
                        return verb(context)
                    # when verb is a regex pattern
                    if isinstance(verb, Pattern) and isinstance(action_verb, str):
                        hits = re.match(verb, action_verb)
                        return hits is not None
                    # when verb is a string
                    return verb == action_verb

            return False

        def __call__(func: Callable[[TurnContext, StateT, Any], Awaitable[Union[str, dict]]]):
            async def __handler__(context: TurnContext, state: StateT) -> bool:
                result = await func(context, state, context.activity.value.action.data)
                if context.turn_state.get(ActivityTypes.invoke_response) is not None:
                    if isinstance(result, str):
                        response = AdaptiveCardInvokeResponse(status_code=200, type="application/vnd.microsoft.activity.message", value=result)
                    else:
                        response = AdaptiveCardInvokeResponse(status_code=200, type="application/vnd.microsoft.card.adaptive", value=result)
                await context.send_activity(InvokeResponse(status=200, body=response))
                return True

            self._route_registry.append(Route[StateT](__selector__, __handler__))
            return func
        
        return __call__
    
    
    def action_submit(self, verb: Union[str, Pattern[str], Callable[[TurnContext], bool]]):
        pass

    def search(self, verb: Union[str, Pattern[str], Callable[[TurnContext], bool]]):
        pass