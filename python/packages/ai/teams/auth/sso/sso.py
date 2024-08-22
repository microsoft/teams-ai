"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from __future__ import annotations

from datetime import datetime
from typing import List, Optional, TypeVar, cast

from botbuilder.core import TurnContext
from botbuilder.schema import Activity, TokenResponse
from msal import ConfidentialClientApplication

from ...auth.auth_component import AuthComponent
from ...state import TurnState
from ..auth import Auth
from .sso_dialog import SsoDialog
from .sso_message_extension import SsoMessageExtension
from .sso_options import SsoOptions

StateT = TypeVar("StateT", bound=TurnState)


class SsoAuth(Auth[StateT]):
    "Handles authentication using SSO Connection."

    _options: SsoOptions
    _msal: ConfidentialClientApplication
    _components: List[AuthComponent[StateT]]

    def __init__(self, name: str, options: SsoOptions) -> None:
        super().__init__()
        self._options = options

        self._msal = ConfidentialClientApplication(
            options.msal_config.client_id, authority=options.msal_config.authority
        )
        self._components = [
            SsoDialog[StateT](name=name, options=options, msal=self._msal),
            SsoMessageExtension[StateT](options, self._msal),
        ]

    def is_sign_in_activity(self, activity: Activity) -> bool:
        for component in self._components:
            if component.is_sign_in_activity(activity):
                return True

        return False

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
        for component in self._components:
            await component.sign_out(context, state)

        aad_object_id = cast(str, getattr(context.activity.from_property, "aad_object_id"))

        if aad_object_id:
            accounts = self._msal.get_accounts()

            for account in accounts:
                if account["local_account_id"] == aad_object_id:
                    self._msal.remove_account(accounts[0])
                    break
        return

    async def get_token(self, context: TurnContext) -> Optional[str]:
        aad_object_id = cast(str, getattr(context.activity.from_property, "aad_object_id"))

        if aad_object_id:
            accounts = self._msal.get_accounts()

            for account in accounts:
                if account["local_account_id"] == aad_object_id:
                    token_result = self._msal.acquire_token_silent(
                        scopes=self._options.scopes, account=account
                    )
                    if token_result is not None:
                        return token_result.get("access_token")
        return None

    async def verify_state(self, context: TurnContext, state: StateT) -> Optional[TokenResponse]:
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

        return None

    async def exchange_token(self, context: TurnContext, state: StateT) -> Optional[TokenResponse]:
        if not context.activity.value:
            return None

        if "__auth__" in state.user:
            state.temp.input = state.user["__auth__"]
            del state.user["__auth__"]

        token_exchange_request = context.activity.value

        result = self._msal.acquire_token_on_behalf_of(
            user_assertion=token_exchange_request["token"], scopes=self._options.scopes
        )

        if result and "access_token" in result:
            return TokenResponse(
                token=result["access_token"],
                expiration=cast(datetime, result["expires_on"]).isoformat(),
            )

        return None
