"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from __future__ import annotations

from typing import Optional, cast

from botbuilder.dialogs import OAuthPromptSettings
from botframework.connector.auth import AppCredentials


class OAuthOptions(OAuthPromptSettings):
    "The settings for OAuthAuthentication."

    enable_sso: bool = False
    "Set to `true` to enable SSO when authenticating using Azure Active Directory (AAD)."

    token_exchange_url: Optional[str] = None
    "The token exchange uri for SSO in adaptive card auth scenario."

    def __init__(
        self,
        *,
        connection_name: str,
        title: str,
        text: Optional[str] = None,
        timeout: Optional[int] = None,
        oauth_app_credentials: Optional[AppCredentials] = None,
        end_on_invalid_message: bool = False,
        enable_sso: bool = False,
        token_exchange_url: Optional[str] = None,
    ) -> None:
        super().__init__(
            connection_name,
            title,
            text or title,
            cast(int, timeout),
            cast(AppCredentials, oauth_app_credentials),
            end_on_invalid_message,
        )

        self.enable_sso = enable_sso
        self.token_exchange_url = token_exchange_url
