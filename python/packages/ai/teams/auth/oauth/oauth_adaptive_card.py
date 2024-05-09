"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from __future__ import annotations

from typing import Generic, Optional, TypeVar, cast

from botbuilder.core import TurnContext
from botbuilder.core.serializer_helper import serializer_helper
from botbuilder.schema import (
    ActionTypes,
    Activity,
    ActivityTypes,
    ChannelAccount,
    InvokeResponse,
    TokenResponse,
)
from botframework.connector.auth import TokenExchangeRequest
from botframework.connector.models import AdaptiveCardInvokeResponse, CardAction

from ...state import TurnState
from ..auth_component import AuthComponent
from .oauth_options import OAuthOptions

StateT = TypeVar("StateT", bound=TurnState)


class OAuthAdaptiveCard(Generic[StateT], AuthComponent[StateT]):
    "handles adaptive card oauth authentication"

    _options: OAuthOptions

    def __init__(self, options: OAuthOptions) -> None:
        super().__init__()
        self._options = options

    def is_sign_in_activity(self, activity: Activity) -> bool:
        return activity.type == ActivityTypes.invoke and activity.name == "adaptiveCard/action"

    async def sso_token_exchange(self, context: TurnContext) -> Optional[TokenResponse]:
        client = self._user_token_client(context)
        value = cast(dict, context.activity.value)

        if value is None or not "authentication" in value:
            return None

        auth = value["authentication"]

        if not "token" in auth:
            return None

        return await client.exchange_token(
            getattr(context.activity.from_property, "id"),
            self._options.connection_name,
            context.activity.channel_id,
            TokenExchangeRequest(token=auth["token"]),
        )

    async def sign_in(self, context: TurnContext, state: StateT) -> Optional[str]:
        client = self._user_token_client(context)
        value = cast(dict, context.activity.value)

        if "authentication" in value:
            res = await self.sso_token_exchange(context)

            if res is not None and res.token != "":
                return res.token

            await context.send_activity(
                Activity(
                    type=ActivityTypes.invoke_response,
                    value=InvokeResponse(
                        status=200,
                        body=serializer_helper(
                            AdaptiveCardInvokeResponse(
                                status_code=412,
                                type="application/vnd.microsoft.error.preconditionFailed",
                                value={
                                    "code": "412",
                                    "message": "failed to exchange token",
                                },
                            )
                        ),
                    ),
                )
            )

            return None

        sign_in_res = await client.get_sign_in_resource(
            self._options.connection_name,
            context.activity,
            "",
        )

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
                                    type=ActionTypes.signin,
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
