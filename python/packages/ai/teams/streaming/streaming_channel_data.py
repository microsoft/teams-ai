"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Optional

from .stream_types import StreamTypes


@dataclass
class StreamingChannelData:
    """A file sent by the user to the bot.

    Attributes:
        stream_type (StreamTypes): The type of message being sent.
        stream_sequence (int): The sequence number of the message in the stream.
            Starts at 1 for the first message, and increments from there.
        stream_id (Optional[str]): The ID of the stream.
            Assigned after the initial update is sent.
    """

    stream_type: StreamTypes
    stream_sequence: Optional[int] = None
    stream_id: Optional[str] = None
