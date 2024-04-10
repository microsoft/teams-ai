"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from __future__ import annotations

from typing import Generic, Optional, TypeVar, cast

from botbuilder.core import TurnContext
from botbuilder.schema import Activity, ActivityTypes, InvokeResponse, TokenResponse
from botbuilder.schema.teams import (
    MessagingExtensionActionResponse,
    MessagingExtensionResult,
    MessagingExtensionSuggestedAction,
)
from botframework.connector.auth import TokenExchangeRequest
from botframework.connector.models import CardAction

from ...state import TurnState
from ..auth import Auth
from ..user_token import exchange_token, get_sign_in_resource, get_user_token
from .oauth_options import OAuthOptions

StateT = TypeVar("StateT", bound=TurnState)


class OAuthMessageExtension(Generic[StateT], Auth[StateT]):
    """
    handles message extension oauth authentication
    """

    _options: OAuthOptions

    def __init__(self, options: OAuthOptions) -> None:
        super().__init__()
        self._options = options

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

        if value is None or not hasattr(value, "authentication"):
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
                    value=InvokeResponse(status=412),
                )
            )

            return None

        res = await self.on_sign_in_complete(context, state)

        if res is not None:
            return res.token

        await context.send_activity(
            Activity(
                type=ActivityTypes.invoke_response,
                value=InvokeResponse(
                    status=200,
                    body=MessagingExtensionActionResponse(
                        compose_extension=MessagingExtensionResult(
                            type=(
                                "silentAuth"
                                if context.activity.name == "composeExtension/query"
                                and self._options.enable_sso
                                else "auth"
                            ),
                            suggested_actions=MessagingExtensionSuggestedAction(
                                actions=[
                                    CardAction(
                                        type="openUrl",
                                        title=self._options.title,
                                        text=self._options.text,
                                        display_text=self._options.text,
                                    )
                                ],
                            ),
                        ),
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
