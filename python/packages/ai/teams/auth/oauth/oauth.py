"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from __future__ import annotations

from typing import Awaitable, Callable, List, Optional, TypeVar, cast

from botbuilder.core import TurnContext
from botbuilder.schema import Activity, TokenResponse

from teams.auth.sign_in_response import SignInResponse

from ...state import TempState, TurnState
from ..auth import Auth
from ..user_token import get_user_token, sign_out_user
from .oauth_adaptive_card import OAuthAdaptiveCard
from .oauth_dialog import OAuthDialog
from .oauth_message_extension import OAuthMessageExtension
from .oauth_options import OAuthOptions

StateT = TypeVar("StateT", bound=TurnState)


class OAuth(Auth[StateT]):
    "Handles authentication using OAuth Connection."

    _options: OAuthOptions
    _components: List[Auth[StateT]]

    def __init__(self, options: OAuthOptions = OAuthOptions()) -> None:
        super().__init__()
        self._options = options
        self._components = [
            OAuthDialog[StateT](options),
            OAuthMessageExtension[StateT](options),
            OAuthAdaptiveCard[StateT](options),
        ]

    def is_valid_activity(self, activity: Activity) -> bool:
        for component in self._components:
            if component.is_valid_activity(activity):
                return True

        return False

    async def is_signed_in(self, context: TurnContext) -> Optional[str]:
        for component in self._components:
            if component.is_valid_activity(context.activity):
                return await component.is_signed_in(context)

        return None

    async def sign_in(self, context: TurnContext, state: StateT) -> Optional[str]:
        res = await get_user_token(context, self._options.connection_name, "")

        if res.token is not None and res.token != "":
            return res.token

        for component in self._components:
            if component.is_valid_activity(context.activity):
                return await component.sign_in(context, state)

        return None

    async def sign_out(self, context: TurnContext, state: StateT) -> None:
        for component in self._components:
            if component.is_valid_activity(context.activity):
                await component.sign_out(context, state)
                break

        await sign_out_user(context, self._options.connection_name)

    async def on_sign_in_complete(
        self, context: TurnContext, state: StateT
    ) -> Optional[TokenResponse]:
        for component in self._components:
            if component.is_valid_activity(context.activity):
                res = await component.on_sign_in_complete(context, state)

                if res is not None:
                    temp = cast(TempState, state.temp)
                    temp.auth_tokens[self._options.connection_name] = res.token

                return res

        return None

    def on_sign_in_success(
        self, callback: Callable[[TurnContext, StateT], Awaitable[None]]
    ) -> None:
        for component in self._components:
            component.on_sign_in_success(callback)

    def on_sign_in_failure(
        self, callback: Callable[[TurnContext, StateT, SignInResponse], Awaitable[None]]
    ) -> None:
        for component in self._components:
            component.on_sign_in_failure(callback)
