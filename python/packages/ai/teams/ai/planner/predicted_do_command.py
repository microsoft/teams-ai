"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from dataclasses import dataclass, field
from typing import Any, Dict, Literal

from .command_type import CommandType
from .predicted_command import PredictedCommand


@dataclass
class PredictedDoCommand(PredictedCommand):
    type: Literal[CommandType.DO] = CommandType.DO
    action: str = ""
    parameters: Dict[str, Any] = field(default_factory=dict)

    @staticmethod
    def from_dict(data: dict) -> "PredictedDoCommand":
        return PredictedDoCommand(
            type=CommandType.DO, action=data["action"], parameters=data["parameters"]
        )
