"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from typing import TypedDict


class TempState(TypedDict):
    """
    inherit a new interface from this base interface to strongly type
    the applications temp state
    """

    input: str
    "input passed to an AI prompt"

    history: str
    "formatted conversation history for embedding in an AI prompt"

    output: str
    "output returned from an AI prompt or function"
