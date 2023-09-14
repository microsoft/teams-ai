"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from dataclasses import dataclass
from typing import Generic, TypeVar

ParamT = TypeVar("ParamT")


@dataclass
class Query(Generic[ParamT]):
    count: int
    skip: int
    parameters: ParamT
