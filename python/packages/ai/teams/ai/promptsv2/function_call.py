"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from dataclasses import dataclass
from typing import Optional


@dataclass
class FunctionCall:
    name: Optional[str]
    arguments: Optional[str]
