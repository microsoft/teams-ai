"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Optional

from botbuilder.dialogs import OAuthPromptSettings


@dataclass
class OAuthOptions(OAuthPromptSettings):
    "The settings for OAuthAuthentication."

    enable_sso: bool = False
    "The token exchange uri for SSO in adaptive card auth scenario."

    token_exchange_url: Optional[str] = None
    "Set to `true` to enable SSO when authenticating using Azure Active Directory (AAD)."
