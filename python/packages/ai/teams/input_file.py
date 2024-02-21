"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Optional


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
