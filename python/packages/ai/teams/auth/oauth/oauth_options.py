"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from __future__ import annotations

from typing import Optional

from botbuilder.dialogs import OAuthPromptSettings
from botframework.connector.auth import AppCredentials


class OAuthOptions(OAuthPromptSettings):
    "The settings for OAuthAuthentication."

    enable_sso: bool = False
    "The token exchange uri for SSO in adaptive card auth scenario."

    token_exchange_url: Optional[str] = None
    "Set to `true` to enable SSO when authenticating using Azure Active Directory (AAD)."

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
        self.connection_name = connection_name
        self.title = title
        self.text = text or title
        self.timeout = timeout
        self.oath_app_credentials = oauth_app_credentials
        self.end_on_invalid_message = end_on_invalid_message
        self.enable_sso = enable_sso
        self.token_exchange_url = token_exchange_url
