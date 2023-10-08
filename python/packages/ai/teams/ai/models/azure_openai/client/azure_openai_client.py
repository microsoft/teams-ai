"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from typing import Dict, List, Literal, Union

from aiohttp import ClientResponseError, ClientSession

from teams.ai.models.openai import (
    CreateModerationResponse,
    OpenAIClient,
    OpenAIClientError,
    OpenAIClientResponse,
)


class AzureOpenAIClient(OpenAIClient):
    """
    Azure OpenAI Http Client
    """

    _api_version: str

    @property
    def _headers(self) -> Dict[str, str]:
        headers = {
            "Content-Type": "application/json",
            "User-Agent": "Microsoft Teams Conversational AI SDK",
            "Ocp-Apim-Subscription-Key": self._api_key,
        }

        return headers

    def __init__(self, api_key: str, *, base_url: str, api_version: str = "2022-12-01") -> None:
        super().__init__(api_key, base_url=base_url)
        self._api_version = api_version

    async def create_moderation(
        self,
        input: Union[str, List[str]],
        *,
        model: Literal[
            "text-moderation-stable", "text-moderation-latest"
        ] = "text-moderation-stable",
    ) -> OpenAIClientResponse[CreateModerationResponse]:
        async with ClientSession(
            base_url=self._base_url,
            headers=self._headers,
        ) as session:
            try:
                res = await session.post(
                    f"/contentsafety/text:analyze?api-version={self._api_version}",
                    json={"text": input},
                )
                data = await res.json()

                if res.status >= 400:
                    raise ClientResponseError(
                        res.request_info, res.history, status=res.status, message=data
                    )

                return OpenAIClientResponse[CreateModerationResponse](
                    status=res.status,
                    headers=res.headers,
                    data=CreateModerationResponse.from_dict(data),
                )
            except ClientResponseError as err:
                raise OpenAIClientError(
                    status=err.status, message=err.message, headers=err.headers
                ) from err
