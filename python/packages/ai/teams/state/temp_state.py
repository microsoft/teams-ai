"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from __future__ import annotations

from typing import Dict, List, Optional

from botbuilder.core import Storage, TurnContext

from ..input_file import InputFile
from .state import State, state


@state
class TempState(State):
    """
    Default Temp State
    """

    input: str = ""
    "Input passed from the user to the AI Library"

    input_files: List[InputFile] = []
    "Downloaded files passed by the user to the AI Library"

    last_output: str = ""
    "Output returned from the last executed action"

    action_outputs: Dict[str, str] = {}
    "All outputs returned from the action sequence that was executed"

    auth_tokens: Dict[str, str] = {}
    "User authentication tokens"

    duplicate_token_exchange: Optional[bool] = None
    "Flag indicating whether a token exchange event has already been processed"

    async def save(self, _context: TurnContext, storage: Optional[Storage] = None) -> None:
        return

    @classmethod
    async def load(cls, context: TurnContext, storage: Optional[Storage] = None) -> "TempState":
        # pylint: disable=unused-argument
        return cls()
