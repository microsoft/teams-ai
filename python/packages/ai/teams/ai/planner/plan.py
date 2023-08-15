"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from dataclasses import dataclass, field
from typing import List

from .plan_type import PlanType
from .predicted_command import PredictedCommand
from .predicted_do_command import PredictedDoCommand
from .predicted_say_command import PredictedSayCommand


@dataclass
class Plan:
    type: PlanType = PlanType.PLAN
    commands: List[PredictedCommand] = field(default_factory=list)

    @staticmethod
    def from_dict(data: dict) -> "Plan":
        plan_type = PlanType(data["type"])
        commands: List[PredictedCommand] = []
        for command in data["commands"]:
            if command["type"] == "DO":
                commands.append(PredictedDoCommand.from_dict(command))
            if command["type"] == "SAY":
                commands.append(PredictedSayCommand.from_dict(command))
        return Plan(plan_type, commands)
