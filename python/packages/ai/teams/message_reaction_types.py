"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from __future__ import annotations

from enum import Enum


class MessageReactionTypes(str, Enum):
    LIKE = "like"
    PLUS_ONE = "plusOne"
