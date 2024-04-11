"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import List, Optional

from botbuilder.core import TurnContext


@dataclass
class InputFile:
    """A file sent by the user to the bot.

    Attributes:
        content (bytes): The downloaded content of the file.
        content_type (str): The content type of the file.
        content_url (Optional[str]): Optional. URL to the content of the file.
    """

    content: bytes
    content_type: str
    content_url: Optional[str]


class InputFileDownloader(ABC):
    """
    A plugin responsible for downloading files relative to the current user's input.
    """

    @abstractmethod
    async def download_files(self, context: TurnContext) -> List[InputFile]:
        """
        Download any files relative to the current user's input.

        Args:
            context (TurnContext): Context for the current turn of conversation.

        Returns:
            List[InputFile]: A list of input files.
        """
