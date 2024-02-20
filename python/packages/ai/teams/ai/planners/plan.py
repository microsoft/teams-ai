"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from dataclasses import dataclass
from typing import Any, Dict, List, Literal, Union


@dataclass
class PredictedDoCommand:
    """
    A predicted DO command is an action that the AI system should perform.
    """

    type: Literal["DO"] = "DO"
    "Type to indicate that a DO command is being returned."

    action: str = ""
    "The named action that the AI system should perform."

    parameters: Dict[str, Any] = {}
    "Any parameters that the AI system should use to perform the action."


@dataclass
class PredictedSayCommand:
    """
    A predicted SAY command is a response that the AI system should say.
    """

    type: Literal["SAY"] = "SAY"
    "Type to indicate that a SAY command is being returned."

    response: str = ""
    "The response that the AI system should say."


PredictedCommand = Union[PredictedDoCommand, PredictedSayCommand]
"A predicted command is a command that the AI system should execute."


@dataclass
class Plan:
    """
    A plan is a set of commands that the AI system will execute.
    """

    type: Literal["plan"] = "plan"
    "Type to indicate that a plan is being returned."

    commands: List[PredictedCommand] = []
    "Array of predicted commands that the AI system should execute."
