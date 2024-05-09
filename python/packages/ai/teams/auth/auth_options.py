"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Callable, Dict, Optional, Union

from botbuilder.core import TurnContext

from .oauth import OAuthOptions


@dataclass
class AuthOptions:
    "authentication options"

    auto: Union[bool, Callable[[TurnContext], bool]] = False
    "Should sign in flow start automatically."

    default: Optional[str] = None
    "Describes the setting the bot should use if the user does not specify a setting name."

    settings: Dict[str, OAuthOptions] = field(default_factory=dict)
    "The authentication settings."
