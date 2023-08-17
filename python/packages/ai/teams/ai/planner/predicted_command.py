"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from dataclasses import dataclass

from .command_type import CommandType


@dataclass
class PredictedCommand:
    type: CommandType
