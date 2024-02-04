"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from dataclasses import dataclass
from typing import List, Literal, Optional

from .completion_config import CompletionConfig


@dataclass
class PromptTemplateConfig:
    """
    Serialized prompt template configuration.

    Attributes:
        schema (float): The schema version of the prompt template. Can be '1' or '1.1'.

        completion (CompletionConfig): Completion settings for the prompt.

        type (Literal['completion']): Type of prompt template. Should always be 'completion'.

        augmentation (Optional[AugmentationConfig]): Augmentation settings for the prompt.
          New in schema version 1.1.

        description (Optional[str]): Description of the prompts purpose.

        default_backends (Optional[List[str]]): Array of backends (models) to use for the prompt.
          Passing the name of a model to use here will override the default model used by a planner.
          Deprecated: Use `completion.model` instead.
    """

    schema: float
    completion: CompletionConfig
    type: Literal["completion"] = "completion"
    description: Optional[str] = None
    default_backends: Optional[List[str]] = None
