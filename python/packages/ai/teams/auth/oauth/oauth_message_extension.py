"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from __future__ import annotations

from typing import Generic, Optional, TypeVar

from botbuilder.core import TurnContext
from botbuilder.schema import Activity, ActivityTypes, TokenResponse

from ...state import TurnState
from ..message_extension import MessageExtension
from ..user_token import exchange_token, get_sign_in_resource, get_user_token
from .oauth_options import OAuthOptions

StateT = TypeVar("StateT", bound=TurnState)


class OAuthMessageExtension(Generic[StateT], MessageExtension[StateT]):
    """
    handles message extension oauth authentication
    """

    _options: OAuthOptions

    def __init__(self, options: OAuthOptions = OAuthOptions()) -> None:
        super().__init__()
        self._options = options

    @property
    def enable_sso(self) -> bool:
        return self._options.enable_sso

    @property
    def title(self) -> str:
        return self._options.title

    @property
    def text(self) -> str:
        return self._options.text

    def is_valid_activity(self, activity: Activity) -> bool:
        return activity.type == ActivityTypes.invoke and activity.name in (
            "composeExtension/query",
            "composeExtension/queryLink",
            "composeExtension/anonymousQueryLink",
            "composeExtension/fetchTask",
        )

    async def get_sign_in_link(self, context: TurnContext) -> Optional[str]:
        res = await get_sign_in_resource(context, self._options.connection_name)
        return res.sign_in_link

    async def sso_token_exchange(self, context: TurnContext) -> Optional[TokenResponse]:
        value = context.activity.value

        if value is None or not hasattr(value, "token"):
            return None

        return await exchange_token(context, self._options.connection_name, value)

    async def is_signed_in(self, context: TurnContext) -> Optional[str]:
        res = await get_user_token(context, self._options.connection_name, "")

        if res is not None and res.token != "":
            return res.token

        return None

    async def sign_out(self, context: TurnContext, state: StateT) -> None:
        return

    async def on_sign_in_complete(
        self, context: TurnContext, state: StateT
    ) -> Optional[TokenResponse]:
        value = context.activity.value

        if value is None or not hasattr(value, "state") or not isinstance(value.state, str):
            return None

        return await get_user_token(context, self._options.connection_name, value.state)
