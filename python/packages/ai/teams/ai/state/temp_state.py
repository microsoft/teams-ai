"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from dataclasses import dataclass, field


@dataclass
class TempState:
    """
    inherit a new interface from this base interface to strongly type
    the applications temp state
    """

    input: str = field(default="")
    "input passed to an AI prompt"

    history: str = field(default="")
    "formatted conversation history for embedding in an AI prompt"

    output: str = field(default="")
    "output returned from an AI prompt or function"
