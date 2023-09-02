"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Optional

from botbuilder.core import Storage
from botbuilder.schema import Activity


@dataclass
class State(ABC):
    """
    State Management
    """

    @abstractmethod
    async def save(self, storage: Optional[Storage]) -> None:
        pass

    @classmethod
    @abstractmethod
    async def from_activity(cls, activity: Activity, storage: Optional[Storage]) -> "State":
        pass
