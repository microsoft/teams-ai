"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from dataclasses import dataclass, field
from typing import List


@dataclass
class ConversationState:
    """
    inherit a new interface from this base interface to strongly type
    the applications conversation state
    """

    __history__: List[str] = field(default_factory=list)
