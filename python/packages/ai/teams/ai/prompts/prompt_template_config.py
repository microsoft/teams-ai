"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from dataclasses import dataclass
from typing import List

from .completion_config import CompletionConfig


@dataclass
class PromptTemplateConfig:
    "serialized prompt template configuration"

    schema: int
    "the schema version of the prompt template, should always be `1`"

    type: str
    "type of prompt template, should always be `completion`"

    description: str
    "description of the prompts purpose"

    completion: CompletionConfig
    "completion settings for the prompt"

    default_backends: List[str]
    """
    optional: array of backends (models) to use for the prompt
    note: passing the name of a model to use here will override the default model used by a planner
    """

    @staticmethod
    def from_dict(data: dict) -> "PromptTemplateConfig":
        "converts a dictionary to a PromptTemplateConfig object"
        return PromptTemplateConfig(
            schema=data["schema"],
            type=data["type"],
            description=data["description"],
            completion=CompletionConfig.from_dict(data["completion"]),
            default_backends=data.get("default_backends", []),
        )
