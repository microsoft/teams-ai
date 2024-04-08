"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from __future__ import annotations

from typing import Awaitable, Callable

from botbuilder.core import TurnContext
from botbuilder.core.teams import TeamsSSOTokenExchangeMiddleware

from ..app_error import ApplicationError


class _TokenExchangeMiddleware(TeamsSSOTokenExchangeMiddleware):
    """
    If the activity name is signin/tokenExchange, self middleware will attempt to exchange the
    token, and deduplicate the incoming call, ensuring only one exchange request is processed.
    """

    async def on_turn(self, context: TurnContext, logic: Callable[[TurnContext], Awaitable]):
        value = context.activity.value

        if (
            value is None
            or not hasattr(value, "connection_name")
            or not isinstance(value.connection_name, str)
        ):
            raise ApplicationError(
                "expected `context.activity.value` to have `connection_name` property"
            )

        if value.connection_name == self._oauth_connection_name:
            await super().on_turn(context, logic)
            return

        await logic(context)
