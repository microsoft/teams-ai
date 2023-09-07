"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from typing import List, Optional, Union

from aiohttp import ClientResponseError, ClientSession

from .openai_client_error import OpenAIClientError
from .openai_client_response import OpenAIClientResponse
from .schemas import CreateModerationResponse


class OpenAIClient:
    """
    OpenAI Http Client
    """

    _api_key: str
    _organization: Optional[str]
    _base_url: str

    @property
    async def _http(self) -> ClientSession:
        async with ClientSession(
            base_url=self._base_url,
            headers={
                "Content-Type": "application/json",
                "User-Agent": "Microsoft Teams Conversational AI SDK",
                "Authorization": f"Bearer {self._api_key}",
            },
        ) as session:
            if self._organization:
                session.headers.add("OpenAI-Organization", self._organization)

            return session

    def __init__(
        self,
        api_key: str,
        *,
        organization: Optional[str] = None,
        base_url: str = "https://api.openai.com",
    ) -> None:
        self._api_key = api_key
        self._organization = organization
        self._base_url = base_url

    async def create_moderation(
        self, input: Union[str, List[str]], model: Optional[str] = None
    ) -> OpenAIClientResponse[CreateModerationResponse]:
        try:
            http = await self._http
            res = await http.post("/v1/moderations", data={"input": input, "model": model})
            data = await res.json()

            return OpenAIClientResponse[CreateModerationResponse](
                status=res.status,
                headers=res.headers,
                data=CreateModerationResponse.from_dict(data),
            )
        except ClientResponseError as err:
            raise OpenAIClientError(
                status=err.status, message=err.message, headers=err.headers
            ) from err
