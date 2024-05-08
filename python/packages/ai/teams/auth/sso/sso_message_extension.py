"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from __future__ import annotations
from typing import Generic, Optional, TypeVar, cast
import re
from datetime import datetime
from urllib.parse import quote

from botbuilder.core import TurnContext
from msal import ConfidentialClientApplication
from botbuilder.core.serializer_helper import serializer_helper 
from botbuilder.schema import (
    Activity,
    ActivityTypes,
    TokenResponse,
    ActionTypes,
    InvokeResponse,
)
from botbuilder.schema.teams import (
    MessagingExtensionActionResponse,
    MessagingExtensionResult,
    MessagingExtensionSuggestedAction,
)
from botframework.connector.auth import TokenExchangeRequest
from botframework.connector.models import CardAction

from .sso_options import SsoOptions
from ...state import TurnState
from ..auth_component import AuthComponent

StateT = TypeVar("StateT", bound=TurnState)


class SsoMessageExtension(Generic[StateT], AuthComponent[StateT]):
    """
    handles message extension sso authentication
    """

    _options: SsoOptions
    _msal: ConfidentialClientApplication

    @property
    def options(self) -> SsoOptions:
        return self._options

    @property
    def msal(self) -> ConfidentialClientApplication:
        return self._msal

    def __init__(self, options: SsoOptions, msal: ConfidentialClientApplication) -> None:
        super().__init__()
        self._options = options
        self._msal = msal
    
    def is_sign_in_activity(self, activity: Activity) -> bool:
        # currently only search based message extensions has SSO
        return activity.type == ActivityTypes.invoke and activity.name == "composeExtension/query" 

    async def sso_token_exchange(self, context: TurnContext) -> Optional[TokenResponse]:
        value = context.activity.value

        if value is None or not hasattr(value, "authentication"):
            return None

        auth = value.authentication

        if auth is None or not isinstance(auth, TokenExchangeRequest):
            return None
        
        result = self._msal.acquire_token_on_behalf_of(
            user_assertion= auth.token,
            scopes= self._options.scopes
        )

        if result is not None:
            return TokenResponse(token=result["access_token"], expiration=cast(datetime, result["expires_on"]).isoformat())

        return None
    
    async def get_sign_in_link(self, context: TurnContext) -> Optional[str]:
        client_id = self._options.msal_config.client_id
        scope = quote(" ".join(self._options.scopes), safe='~@#$&()*!+=:;,?/\'')

        authority = self._options.msal_config.authority

        if not authority:
            authority = "https://login.microsoftonline.com/common/"
        
        regex = r"/https:\/\/[^\/]+\/([^\/]+)\/?/"
        tenant_id = re.findall(regex, authority)[1]

        return f"{self._options.sign_in_link}?scope=${scope}&clientId=${client_id}&tenantId=${tenant_id}"
    
    async def sign_in(self, context: TurnContext, state: StateT) -> Optional[str]:
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
                    body=serializer_helper(
                        MessagingExtensionActionResponse(
                            compose_extension=MessagingExtensionResult(
                                type="silentAuth",
                                suggested_actions=MessagingExtensionSuggestedAction(
                                    actions=[
                                        CardAction(
                                            type=ActionTypes.open_url,
                                            title="Bot Service Oauth",
                                            text="You'll need to signin to use this app.",
                                            display_text="You'll need to signin to use this app.",
                                        )
                                    ],
                                ),
                            ),
                        )
                    ),
                ),
            )
        )

        return None
