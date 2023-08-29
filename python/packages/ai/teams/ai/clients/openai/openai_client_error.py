"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from typing import Optional

from aiohttp.typedefs import LooseHeaders

from teams.app_error import ApplicationError


class OpenAIClientError(ApplicationError):
    """
    OpenAI Module Error
    """

    status: int
    message: str
    headers: Optional[LooseHeaders]

    def __init__(self, status: int, message: str, headers: Optional[LooseHeaders] = None) -> None:
        super().__init__(message)
        self.status = status
        self.headers = headers
