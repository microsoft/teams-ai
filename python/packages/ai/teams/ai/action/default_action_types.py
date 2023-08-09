"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from enum import Enum


class DefaultActionTypes(str, Enum):
    UNKNOWN_ACTION = "__UnknownAction__"
    FLAGGED_INPUT = "__FlaggedInput__"
    FLAGGED_OUTPUT = "__FlaggedOutput__"
    RATE_LIMITED = "__RateLimited__"
    PLAN_READY = "__PlanReady__"
    DO_COMMAND = "__DO__"
    SAY_COMMAND = "__SAY__"
