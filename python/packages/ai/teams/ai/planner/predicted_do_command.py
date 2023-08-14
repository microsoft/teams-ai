"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from dataclasses import dataclass
from typing import Dict

from teams.ai.planner.command_type import CommandType
from teams.ai.planner.predicted_command import PredictedCommand


@dataclass
class PredictedDoCommand(PredictedCommand):
    type: CommandType.DO
    action: str
    entities: Dict[str, any]

    @staticmethod
    def from_dict(data: dict) -> "PredictedDoCommand":
        return PredictedDoCommand(
            type=CommandType.DO, action=data["action"], entities=data["entities"]
        )
