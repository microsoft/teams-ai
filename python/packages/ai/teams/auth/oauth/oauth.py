"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from __future__ import annotations

from typing import List, Optional, TypeVar

from botbuilder.core import TurnContext
from botbuilder.schema import Activity, TokenResponse
from botframework.connector.token_api.models import TokenExchangeRequest

from ...state import TurnState
from ..auth import Auth
from ..auth_component import AuthComponent
from .oauth_adaptive_card import OAuthAdaptiveCard
from .oauth_dialog import OAuthDialog
from .oauth_message_extension import OAuthMessageExtension
from .oauth_options import OAuthOptions

StateT = TypeVar("StateT", bound=TurnState)


class OAuth(Auth[StateT]):
    "Handles authentication using OAuth Connection."

    _options: OAuthOptions
    _components: List[AuthComponent[StateT]]

    def __init__(self, options: OAuthOptions) -> None:
        super().__init__()
        self._options = options
        self._components = [
            OAuthDialog[StateT](options),
            OAuthMessageExtension[StateT](options),
            OAuthAdaptiveCard[StateT](options),
        ]

    def is_sign_in_activity(self, activity: Activity) -> bool:
        for component in self._components:
            if component.is_sign_in_activity(activity):
                return True

        return False

    async def get_token(self, context: TurnContext) -> Optional[str]:
        client = self._user_token_client(context)
        code = ""
        if isinstance(context.activity.value, dict) and "state" in context.activity.value:
            code = context.activity.value["state"]
        res = await client.get_user_token(
            getattr(context.activity.from_property, "id"),
            self._options.connection_name,
            context.activity.channel_id,
            code,
        )

        if res and res.token:
            return res.token

        return None

    async def sign_in(self, context: TurnContext, state: StateT) -> Optional[str]:
        token = await self.get_token(context)

        if token:
            return token

        for component in self._components:
            if component.is_sign_in_activity(context.activity):
                state.user["__auth__"] = state.temp.input
                return await component.sign_in(context, state)

        return None

    async def sign_out(self, context: TurnContext, state: StateT) -> None:
        client = self._user_token_client(context)

        for component in self._components:
            await component.sign_out(context, state)

        await client.sign_out_user(
            getattr(context.activity.from_property, "id"),
            self._options.connection_name,
            context.activity.channel_id,
        )

    async def verify_state(self, context: TurnContext, state: StateT) -> Optional[TokenResponse]:
        client = self._user_token_client(context)
        value = context.activity.value
        code: Optional[str] = None

        if value is None:
            return None

        if hasattr(value, "state") and isinstance(value.state, str):
            code = getattr(value, "state")

        if isinstance(value, dict) and "state" in value:
            code = value["state"]

        if code is None:
            return None

        if "__auth__" in state.user:
            state.temp.input = state.user["__auth__"]
            del state.user["__auth__"]

        return await client.get_user_token(
            getattr(context.activity.from_property, "id"),
            self._options.connection_name,
            context.activity.channel_id,
            code,
        )

    async def exchange_token(self, context: TurnContext, state: StateT) -> Optional[TokenResponse]:
        client = self._user_token_client(context)

        if not context.activity.value:
            return None

        if "__auth__" in state.user:
            state.temp.input = state.user["__auth__"]
            del state.user["__auth__"]

        return await client.exchange_token(
            getattr(context.activity.from_property, "id"),
            self._options.connection_name,
            context.activity.channel_id,
            TokenExchangeRequest(token=context.activity.value.get("token")),
        )
