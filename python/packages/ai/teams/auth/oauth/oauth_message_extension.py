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
from ..auth_component import AuthComponent
from .oauth_options import OAuthOptions

StateT = TypeVar("StateT", bound=TurnState)


class OAuthMessageExtension(Generic[StateT], AuthComponent[StateT]):
    """
    handles message extension oauth authentication
    """

    _options: OAuthOptions

    def __init__(self, options: OAuthOptions) -> None:
        super().__init__()
        self._options = options

    def is_sign_in_activity(self, activity: Activity) -> bool:
        return activity.type == ActivityTypes.invoke and activity.name in (
            "composeExtension/query",
            "composeExtension/queryLink",
            "composeExtension/anonymousQueryLink",
            "composeExtension/fetchTask",
        )

    async def get_sign_in_link(self, context: TurnContext) -> Optional[str]:
        client = self._user_token_client(context)
        res = await client.get_sign_in_resource(
            self._options.connection_name,
            context.activity,
            "",
        )

        return res.sign_in_link

    async def sso_token_exchange(self, context: TurnContext) -> Optional[TokenResponse]:
        client = self._user_token_client(context)
        value = context.activity.value

        if value is None or not hasattr(value, "authentication"):
            return None

        auth = value.authentication

        if auth is None or not isinstance(auth, TokenExchangeRequest):
            return None

        return await client.exchange_token(
            getattr(context.activity.from_property, "id"),
            self._options.connection_name,
            context.activity.channel_id,
            auth,
        )

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
