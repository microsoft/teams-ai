"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from dataclasses import dataclass

from teams.ai.planner.plan_type import PlanType
from teams.ai.planner.predicted_command import PredictedCommand

from .predicted_do_command import PredictedDoCommand
from .predicted_say_command import PredictedSayCommand


@dataclass
class Plan:
    type: PlanType = PlanType.PLAN
    commands: list[PredictedCommand] = []

    @staticmethod
    def from_dict(data: dict) -> "Plan":
        plan_type = PlanType(data["type"])
        commands = []
        for command in data["commands"]:
            if command["type"] == "DO":
                commands.append(PredictedDoCommand.from_dict(command))
            if command["type"] == "SAY":
                commands.append(PredictedSayCommand.from_dict(command))
        return Plan(plan_type, commands)
