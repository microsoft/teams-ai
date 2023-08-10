"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from enum import Enum


class DefaultActionTypes(str, Enum):
    UNKNOWN_ACTION = "___UnknownAction___"
    FLAGGED_INPUT = "___FlaggedInput___"
    FLAGGED_OUTPUT = "___FlaggedOutput___"
    RATE_LIMITED = "___RateLimited___"
    PLAN_READY = "___PlanReady___"
    DO_COMMAND = "___DO___"
    SAY_COMMAND = "___SAY___"
