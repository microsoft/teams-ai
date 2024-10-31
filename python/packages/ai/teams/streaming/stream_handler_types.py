"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from __future__ import annotations

from enum import Enum


class StreamHandlerTypes(str, Enum):
    BEFORE_COMPLETION = "BeforeCompletion"
    CHUNK_RECEIVED = "ChunkReceived"
    RESPONSE_RECEIVED = "ResponseReceived"
