"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from typing import List, Optional, Union

from aiohttp import ClientResponseError, ClientSession

from .openai_client_error import OpenAIClientError
from .openai_client_response import OpenAIClientResponse
from .schemas import CreateModerationResponse


class OpenAIClient(ClientSession):
    """
    OpenAI Http Client
    """

    def __init__(
        self,
        api_key: str,
        base_url: str = "https://api.openai.com",
        organization: Optional[str] = None,
    ) -> None:
        super().__init__(
            base_url=base_url,
            headers={
                "Content-Type": "application/json",
                "User-Agent": "Microsoft Teams Conversational AI SDK",
                "Authorization": f"Bearer {api_key}",
            },
        )

        if organization:
            self.headers.add("OpenAI-Organization", organization)

    async def create_moderation(
        self, input: Union[str, List[str]], model: Optional[str] = None
    ) -> OpenAIClientResponse[CreateModerationResponse]:
        try:
            res = await self.post("/v1/moderations", data={"input": input, "model": model})
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
