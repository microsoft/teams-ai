"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Awaitable, Callable, Dict, Optional, Union
from dataclasses_json import DataClassJsonMixin, dataclass_json


@dataclass_json
@dataclass
class OpenAIFunction(DataClassJsonMixin):
    """
    Function spec that adheres to OpenAI function calling.
    """

    name: str
    """
    Name of the function to be called.
    """

    description: Optional[str]
    """
    Description of what the function does.
    """

    parameters: Optional[Dict[str, Any]]
    """
    Parameters the function accepts, described as a JSON Schema object.
    """

    handler: Callable[..., Union[str, Awaitable[str]]]
    """
    The function handler, may be asynchoronous, takes in any number of
    arguments and must return a string.
    """
