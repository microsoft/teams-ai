"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from __future__ import annotations

import re
from typing import Awaitable, Callable, Generic, List, Pattern, TypeVar, Union

from botbuilder.core import TurnContext
from botbuilder.schema import (
    Activity,
    ActivityTypes,
    AdaptiveCardInvokeResponse,
    InvokeResponse,
)

from teams.query import Query
from teams.route import Route
from teams.state import TurnState

from .adaptive_cards_search_params import AdaptiveCardsSearchParams
from .adaptive_cards_search_result import AdaptiveCardsSearchResult

ACTION_INVOKE_NAME = "adaptiveCard/action"
ACTION_EXECUTE_TYPE = "Action.Execute"
SEARCH_INVOKE_NAME = "application/search"

StateT = TypeVar("StateT", bound=TurnState)


class AdaptiveCards(Generic[StateT]):
    _route_registry: List[Route]
    _action_submit_filter: str

    def __init__(self, route_registry: List[Route], action_submit_filter: str) -> None:
        self._route_registry = route_registry
        self._action_submit_filter = action_submit_filter

    def action_execute(
        self, verb: Union[str, Pattern[str], Callable[[TurnContext], bool]]
    ) -> Callable[
        [Callable[[TurnContext, StateT, dict], Awaitable[Union[str, dict]]]],
        Callable[[TurnContext, StateT, dict], Awaitable[Union[str, dict]]],
    ]:
        """
        Adds a route for handling Adaptive Card Action.Execute events.
        This method can be used as either a decorator or a method.

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
            if (
                context.activity.type == ActivityTypes.invoke
                and context.activity.name == ACTION_INVOKE_NAME
            ):
                action = context.activity.value["action"] if context.activity.value else None
                action_type = action["type"] if action else None
                action_verb = action["verb"] if action else None
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

        def __call__(
            func: Callable[[TurnContext, StateT, dict], Awaitable[Union[str, dict]]],
        ) -> Callable[[TurnContext, StateT, dict], Awaitable[Union[str, dict]]]:
            async def __handler__(context: TurnContext, state: StateT) -> bool:
                result = await func(context, state, context.activity.value["action"]["data"])

                if context.turn_state.get(context._INVOKE_RESPONSE_KEY) is None:
                    if isinstance(result, str):
                        response = AdaptiveCardInvokeResponse(
                            status_code=200,
                            type="application/vnd.microsoft.activity.message",
                            value=result,
                        )
                    else:
                        response = AdaptiveCardInvokeResponse(
                            status_code=200,
                            type="application/vnd.microsoft.card.adaptive",
                            value=result,
                        )
                    await context.send_activity(
                        Activity(
                            type="invokeResponse", value=InvokeResponse(status=200, body=response)
                        )
                    )
                return True

            self._route_registry.append(Route[StateT](__selector__, __handler__))
            return func

        return __call__

    def action_submit(
        self, verb: Union[str, Pattern[str], Callable[[TurnContext], bool]]
    ) -> Callable[
        [Callable[[TurnContext, StateT, dict], Awaitable[None]]],
        Callable[[TurnContext, StateT, dict], Awaitable[None]],
    ]:
        """
        Adds a route for handling Adaptive Card Action.Submit events.
        This method can be used as either a decorator or a method.

        ```python
        # Use this method as a decorator
        @app.adaptive_cards.action_submit("submit")
        async def execute_submit(context: TurnContext, state: TurnState, data: Any):
            print(f"Execute with data: {data}")
            return True

        # Pass a function to this method
        app.adaptive_cards.action_submit("submit")(execute_submit)
        ```

        #### Args:
        - `verb`: a string, regex pattern or a function to match the verb of the action
        """

        # Create route selector for the handler
        def __selector__(context: TurnContext) -> bool:
            filter = self._action_submit_filter
            if (
                context.activity.type == ActivityTypes.message
                and context.activity.text is None
                and isinstance(context.activity.value, dict)
            ):
                filter_value = context.activity.value.get(filter)
                # when verb is a function
                if callable(verb):
                    return verb(context)
                # when verb is a regex pattern
                if isinstance(verb, Pattern) and isinstance(filter_value, str):
                    hits = re.match(verb, filter_value)
                    return hits is not None
                # when verb is a string
                return verb == filter_value

            return False

        def __call__(
            func: Callable[[TurnContext, StateT, dict], Awaitable[None]],
        ) -> Callable[[TurnContext, StateT, dict], Awaitable[None]]:
            async def __handler__(context: TurnContext, state: StateT) -> bool:
                await func(context, state, context.activity.value)
                return True

            self._route_registry.append(Route[StateT](__selector__, __handler__))
            return func

        return __call__

    def search(self, dataset: Union[str, Pattern[str], Callable[[TurnContext], bool]]) -> Callable[
        [
            Callable[
                [TurnContext, StateT, Query[AdaptiveCardsSearchParams]],
                Awaitable[List[AdaptiveCardsSearchResult]],
            ]
        ],
        Callable[
            [TurnContext, StateT, Query[AdaptiveCardsSearchParams]],
            Awaitable[List[AdaptiveCardsSearchResult]],
        ],
    ]:
        """
        Adds a route for handling Adaptive Card search events. This method can be used as either
        a decorator or a method.

        ```python
        # Use this method as a decorator
        @app.adaptive_cards.search("people")
        async def search_people(context: TurnContext, state: TurnState, query: Any):
            print(f"Execute with query: {query}")
            return True

        # Pass a function to this method
        app.adaptive_cards.search("people")(search_people)
        ```

        #### Args:
        - `dataset`: a string, regex pattern or a function to match the verb of the action
        """

        # Create route selector for the handler
        def __selector__(context: TurnContext) -> bool:
            if (
                context.activity.type == ActivityTypes.invoke
                and context.activity.name == SEARCH_INVOKE_NAME
            ):
                activity_dataset = (
                    context.activity.value["dataset"] if context.activity.value else None
                )
                # when verb is a function
                if callable(dataset):
                    return dataset(context)
                # when verb is a regex pattern
                if isinstance(dataset, Pattern) and isinstance(activity_dataset, str):
                    hits = re.match(dataset, activity_dataset)
                    return hits is not None
                # when verb is a string
                return dataset == activity_dataset

            return False

        def __call__(
            func: Callable[
                [TurnContext, StateT, Query[AdaptiveCardsSearchParams]],
                Awaitable[List[AdaptiveCardsSearchResult]],
            ],
        ) -> Callable[
            [TurnContext, StateT, Query[AdaptiveCardsSearchParams]],
            Awaitable[List[AdaptiveCardsSearchResult]],
        ]:
            async def __handler__(context: TurnContext, state: StateT) -> bool:
                params = context.activity.value
                # Flatten search parameters
                query = Query[AdaptiveCardsSearchParams](
                    count=(
                        params["queryOptions"]["top"]
                        if params and params["queryOptions"] and params["queryOptions"]["top"]
                        else 25
                    ),
                    skip=(
                        params["queryOptions"]["skip"]
                        if params and params["queryOptions"] and params["queryOptions"]["skip"]
                        else 0
                    ),
                    parameters=AdaptiveCardsSearchParams(
                        query_text=params["queryText"] if params and params["queryText"] else "",
                        dataset=params["dataset"] if params and params["dataset"] else "",
                    ),
                )
                result = await func(context, state, query)
                if context.turn_state.get(context._INVOKE_RESPONSE_KEY) is None:
                    # Format invoke response
                    response = {
                        "type": "application/vnd.microsoft.search.searchResponse",
                        "value": {"results": result},
                    }
                    await context.send_activity(
                        Activity(
                            type="invokeResponse", value=InvokeResponse(status=200, body=response)
                        )
                    )
                return True

            self._route_registry.append(Route[StateT](__selector__, __handler__))
            return func

        return __call__
