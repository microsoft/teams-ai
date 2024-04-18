"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from typing import Any, Dict
from kiota_abstractions.request_information import RequestInformation
from kiota_abstractions.authentication import AuthenticationProvider

class GraphAuthenticationProvider(AuthenticationProvider):
    _token: str

    def __init__(self, token: str) -> None:
        self._token = token

    async def authenticate_request(
        self,
        request: RequestInformation,
        additional_authentication_context: Dict[str, Any] = {}
    ) -> None:
        request.headers.add("Authentication", f"Bearer {self._token}")