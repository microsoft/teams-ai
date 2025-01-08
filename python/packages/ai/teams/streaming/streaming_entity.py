"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Optional

from botbuilder.schema import Entity


@dataclass
class StreamingEntity(Entity):
    """
    Child class of BotBuilder's Entity class. Temporarily needed for mapping until the oficial
    version of their SDK releases a StreamingEntity class.
    """

    _attribute_map = {
        "type": {"key": "type", "type": "str"},
        "stream_id": {"key": "streamId", "type": "str"},
        "stream_type": {"key": "streamType", "type": "str"},
        "stream_sequence": {"key": "streamSequence", "type": "int"},
    }

    stream_type: str
    stream_sequence: Optional[int]
    stream_id: Optional[str]
    type: str = "streaminfo"
