"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from __future__ import annotations

from typing import Generic, TypeVar

from botbuilder.core import TurnContext

DataT = TypeVar("DataT")


class ActionTurnContext(TurnContext, Generic[DataT]):
    name: str
    """
    The action name
    """

    data: DataT
    """
    Action specific data
    """

    def __init__(self, name: str, data: DataT, context: TurnContext) -> None:
        super().__init__(context)
        context.copy_to(self)
        self._turn_state = context.turn_state
        self.name = name
        self.data = data
