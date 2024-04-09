"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from __future__ import annotations

from typing import Generic, Optional, TypeVar, cast

from botbuilder.core import TurnContext
from botbuilder.schema import (
    Activity,
    ActivityTypes,
    ChannelAccount,
    InvokeResponse,
    TokenResponse,
)
from botframework.connector.auth import TokenExchangeRequest
from botframework.connector.models import (
    AdaptiveCardInvokeResponse,
    AdaptiveCardInvokeValue,
    CardAction,
)

from ...state import TurnState
from ..auth import Auth
from ..user_token import exchange_token, get_sign_in_resource, get_user_token
from .oauth_options import OAuthOptions

StateT = TypeVar("StateT", bound=TurnState)


class OAuthAdaptiveCard(Generic[StateT], Auth[StateT]):
    "handles adaptive card oauth authentication"

    _options: OAuthOptions

    def __init__(self, options: OAuthOptions) -> None:
        super().__init__()
        self._options = options

    def is_valid_activity(self, activity: Activity) -> bool:
        return activity.type == ActivityTypes.invoke and activity.name == "adaptiveCard/action"

    async def sso_token_exchange(self, context: TurnContext) -> Optional[TokenResponse]:
        value = context.activity.value

        if value is None or not isinstance(value, AdaptiveCardInvokeValue):
            return None

        auth = value.authentication

        if auth is None or not isinstance(auth, TokenExchangeRequest):
            return None

        return await exchange_token(context, self._options.connection_name, auth)

    async def is_signed_in(self, context: TurnContext) -> Optional[str]:
        res = await get_user_token(context, self._options.connection_name, "")

        if res is not None and res.token != "":
            return res.token

        return None

    async def sign_in(self, context: TurnContext, state: StateT) -> str | None:
        value = cast(dict, context.activity.value)

        if "authentication" in value and "token" in value["authentication"]:
            res = await self.sso_token_exchange(context)

            if res is not None and res.token != "":
                return res.token

            await context.send_activity(
                Activity(
                    type=ActivityTypes.invoke_response,
                    value=InvokeResponse(
                        status=200,
                        body=AdaptiveCardInvokeResponse(
                            status_code=412,
                            type="application/vnd.microsoft.error.preconditionFailed",
                            value={
                                "code": "412",
                                "message": "failed to exchange token",
                            },
                        ),
                    ),
                )
            )

            return None

        res = await self.on_sign_in_complete(context, state)

        if res is not None:
            return res.token

        sign_in_res = await get_sign_in_resource(context, self._options.connection_name)

        if not sign_in_res.sign_in_link:
            raise ValueError("OAuth:AdaptiveCard => no sign-in link found")

        await context.send_activity(
            Activity(
                type=ActivityTypes.invoke_response,
                value=InvokeResponse(
                    status=200,
                    body=AdaptiveCardInvokeResponse(
                        status_code=401,
                        type="application/vnd.microsoft.activity.loginRequest",
                        value={
                            "text": self._options.title,
                            "connection_name": self._options.connection_name,
                            "buttons": [
                                CardAction(
                                    type="signin",
                                    title="Sign-In",
                                    text="Sign-In",
                                    value=sign_in_res.sign_in_link,
                                )
                            ],
                            "token_exchange_resource": (
                                {
                                    "id": cast(ChannelAccount, context.activity.recipient).id,
                                    "uri": self._options.token_exchange_url,
                                }
                                if self._options.token_exchange_url is not None
                                and self._options.enable_sso
                                else None
                            ),
                        },
                    ),
                ),
            )
        )

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
