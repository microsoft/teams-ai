"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, Literal, Optional


@dataclass
class AugmentationConfig:
    """
    Interface for the augmentation configuration portion of a prompt template.
    New in schema version 1.1.

    Attributes:
        augmentation_type (Literal['none','sequence', 'monologue']): Type of augmentation to use.

        data_sources (Optional[Dict[str, float]]): List of named data sources
            to augment the prompt with. For each data source, the value is the max number of
            tokens to use from the data source.
    """

    augmentation_type: Literal["none", "sequence", "monologue"] = "none"
    data_sources: Optional[Dict[str, float]] = None

    @classmethod
    def from_dict(cls, data: dict) -> "AugmentationConfig":
        return cls(
            augmentation_type=data.get("augmentation_type", "none"),
            data_sources=data.get("data_sources"),
        )
