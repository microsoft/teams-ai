"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from __future__ import annotations

from enum import Enum


class ActionTypes(str, Enum):
    STOP = "STOP"
    UNKNOWN_ACTION = "___UnknownAction___"
    FLAGGED_INPUT = "___FlaggedInput___"
    FLAGGED_OUTPUT = "___FlaggedOutput___"
    HTTP_ERROR = "___HttpError___"
    PLAN_READY = "___PlanReady___"
    DO_COMMAND = "___DO___"
    SAY_COMMAND = "___SAY___"
    TOO_MANY_STEPS = "__TooManySteps__"
