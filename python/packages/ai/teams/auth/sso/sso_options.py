"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from __future__ import annotations
from dataclasses import dataclass
from typing import List, Any

from dataclasses_json import DataClassJsonMixin, dataclass_json

@dataclass_json
@dataclass
class SsoOptions(DataClassJsonMixin):
    """
    The settings for Teams Single Sign-On (SSO) authentication.
    """

    scopes: List[str]
    "The AAD scopes for authentication. Only one resource is allowed in the scopes."

    msal_config: ConfidentialClientApplicationOptions
    "The configuration options for the ConfidentialClientApplication."

    sign_in_link: str
    "Library passes `scope`, `client_id`, and `tenant_id` as query params to compose the AAD sign-in URL."

    timeout: int = 900000
    "Number of ms to wait for the user to auth. Default 15 mins. Only in conversional bot scenario."

    end_on_invalid_message: bool = True
    "Whether auth should end upon receiving an invalid message. Only works in conversional bot scenario."

    storage: Any = None

@dataclass_json
@dataclass
class ConfidentialClientApplicationOptions(DataClassJsonMixin):
    "Attributes associated with constructing an ConfidentialClientApplication"
    client_id: str
    authority: str
    client_secret: str