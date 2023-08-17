"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from dataclasses import dataclass
from typing import Literal, Optional


@dataclass
class OpenAIModeratorOptions:
    """
    Options for the OpenAI based moderator.
    """

    api_key: str
    """
    OpenAI API Key
    """

    moderate: Literal["input", "output", "both"]
    """
    Which parts of the conversation to moderate.
    """

    organization: Optional[str] = None
    """
    Optional. OpenAI organization.
    """

    model: Optional[str] = None
    """
    Optional. OpenAI model to use.
    """

    api_version: Optional[str] = None
    """
    Optional. Azure Content Safety API version.
    """
