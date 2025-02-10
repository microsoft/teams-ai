"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Optional

from ..ai.prompts.message import Message


@dataclass
class PromptChunk:
    """
    Streaming chunk passed in the `ChunkReceived` event.
    """

    delta: Optional[Message[str]] = None
    """
    Delta for the response message being buffered up.
    """
