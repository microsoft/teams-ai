"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from dataclasses import dataclass
from typing import Literal

from .command_type import CommandType
from .predicted_command import PredictedCommand


@dataclass
class PredictedSayCommand(PredictedCommand):
    type: Literal[CommandType.SAY] = CommandType.SAY
    response: str = ""

    @staticmethod
    def from_dict(data: dict) -> "PredictedSayCommand":
        return PredictedSayCommand(type=CommandType.SAY, response=data["response"])
