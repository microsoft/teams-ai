"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from dataclasses import dataclass
from typing import TypedDict


@dataclass
class ConversationState(TypedDict):
    """
    inherit a new interface from this base interface to strongly type
    the applications conversation state
    """
