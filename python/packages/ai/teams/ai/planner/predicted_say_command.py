"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from dataclasses import dataclass

from teams.ai.planner.command_type import CommandType
from teams.ai.planner.predicted_command import PredictedCommand


@dataclass
class PredictedSayCommand(PredictedCommand):
    type: CommandType.SAY
    response: str

    @staticmethod
    def from_dict(data: dict) -> "PredictedSayCommand":
        return PredictedSayCommand(type=CommandType.SAY, response=data["response"])
