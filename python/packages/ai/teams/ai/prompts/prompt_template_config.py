"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import List, Literal, Optional

from .augmentation_config import AugmentationConfig
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

        augmentation (Optional[AugmentationConfig]): Optional augmentation settings for the prompt.
          New in schema version 1.1
    """

    schema: float
    completion: CompletionConfig
    type: Literal["completion"] = "completion"
    description: Optional[str] = None
    default_backends: Optional[List[str]] = None
    augmentation: Optional[AugmentationConfig] = None

    @classmethod
    def from_dict(cls, data: dict) -> "PromptTemplateConfig":
        config = cls(
            schema=data.get("schema", 1.0),
            completion=CompletionConfig.from_dict(data["completion"]),
            type=data.get("type", "completion"),
            description=data.get("description"),
            default_backends=data.get("default_backends"),
        )

        if data.get("augmentation"):
            config.augmentation = AugmentationConfig.from_dict(
                data.get("augmentation")  # type: ignore[arg-type]
            )

        return config
