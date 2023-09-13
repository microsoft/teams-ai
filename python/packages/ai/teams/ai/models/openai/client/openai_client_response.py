"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from dataclasses import dataclass
from typing import Generic, TypeVar

from multidict import CIMultiDictProxy

DataT = TypeVar("DataT")


@dataclass
class OpenAIClientResponse(Generic[DataT]):
    status: int
    headers: CIMultiDictProxy[str]
    data: DataT
