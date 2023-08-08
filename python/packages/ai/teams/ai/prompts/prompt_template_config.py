"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from dataclasses import dataclass
from typing import List, Union
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

    default_backends: Union[List[str], None]
    """
    optional: array of backends (models) to use for the prompt
    note: passing the name of a model to use here will override the default model used by a planner
    """
