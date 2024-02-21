"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Dict, Optional

from dataclasses_json import DataClassJsonMixin, dataclass_json


@dataclass_json
@dataclass
class ChatCompletionAction(DataClassJsonMixin):
    """
    An action that can be called by an LLM.
    """

    name: str
    """
    Name of the action to be called.
    """

    description: Optional[str] = None
    """
    Optional. Description of what the action does.
    """

    parameters: Optional[Dict[str, Any]] = None
    """
    Optional. Parameters the action accepts, described as a JSON Schema object.
    """
