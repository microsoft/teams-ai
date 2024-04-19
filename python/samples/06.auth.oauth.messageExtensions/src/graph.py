"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from typing import Any, Optional
from azure.core.credentials import AccessToken, TokenCredential

class GraphTokenProvider(TokenCredential):
    _token: str

    def __init__(self, token: str) -> None:
        self._token = token

    def get_token(
        self,
        *scopes: str,
        claims: Optional[str] = None,
        tenant_id: Optional[str] = None,
        enable_cae: bool = False,
        **kwargs: Any
    ) -> AccessToken:
        return AccessToken(self._token, 0)