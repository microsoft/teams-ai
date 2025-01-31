"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Literal, Optional

from dataclasses_json import DataClassJsonMixin, config, dataclass_json


@dataclass_json
@dataclass
class StreamingChannelData(DataClassJsonMixin):
    """
    Structure of the outgoing channelData field for streaming responses.
    The expected sequence of stream_types is:
    "informative", "streaming", "streaming",..."final".

    Once the "final" message is sent, the stream is considered ended.

    Attributes:
        stream_type (str): The type of message being sent.
        stream_sequence (int): The sequence number of the message in the stream.
            Starts at 1 for the first message, and increments from there.
        stream_id (Optional[str]): The ID of the stream.
            Assigned after the initial update is sent.
        feedback_loop_enabled (Optional[bool]): Whether the feedback loop is enabled.
        feedback_loop_type (Optional[Literal["default", "custom"]]): the type of
            feedback loop ux to use
    """

    stream_type: str = field(metadata=config(field_name="streamType"))
    stream_sequence: Optional[int] = field(
        default=None, metadata=config(field_name="streamSequence")
    )
    stream_id: Optional[str] = field(default=None, metadata=config(field_name="streamId"))
    feedback_loop_enabled: Optional[bool] = field(
        default=None, metadata=config(field_name="feedbackLoopEnabled")
    )
    feedback_loop_type: Optional[Literal["default", "custom"]] = field(
        default=None, metadata=config(field_name="feedbackLoopType")
    )
