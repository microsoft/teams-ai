"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Dict, List, Literal, Optional, Union

from dataclasses_json import DataClassJsonMixin, dataclass_json

from ..prompts.message import Message


@dataclass_json
@dataclass
class PredictedDoCommand(DataClassJsonMixin):
    """
    A predicted DO command is an action that the AI system should perform.
    """

    type: Literal["DO"] = "DO"
    "Type to indicate that a DO command is being returned."

    action: str = ""
    "The named action that the AI system should perform."

    parameters: Dict[str, Any] = field(default_factory=dict)
    "Any parameters that the AI system should use to perform the action."


@dataclass_json
@dataclass
class PredictedSayCommand(DataClassJsonMixin):
    """
    A predicted SAY command is a response that the AI system should say.
    """

    type: Literal["SAY"] = "SAY"
    "Type to indicate that a SAY command is being returned."

    response: Optional[Message[str]] = None
    "The prompt response containing what the AI system should say."


PredictedCommand = Union[PredictedDoCommand, PredictedSayCommand]
"A predicted command is a command that the AI system should execute."


@dataclass
class Plan:
    """
    A plan is a set of commands that the AI system will execute.
    """

    type: Literal["plan"] = "plan"
    "Type to indicate that a plan is being returned."

    commands: List[PredictedCommand] = field(default_factory=list)
    "Array of predicted commands that the AI system should execute."

    @classmethod
    def from_dict(cls, dict: Dict[str, Any], *, infer_missing: bool = False) -> "Plan":
        commands: List[PredictedCommand] = []
        for command in dict["commands"]:
            if command["type"] == "DO":
                commands.append(PredictedDoCommand.from_dict(command, infer_missing=infer_missing))
            if command["type"] == "SAY":
                commands.append(PredictedSayCommand.from_dict(command, infer_missing=infer_missing))
        return Plan(commands=commands)
