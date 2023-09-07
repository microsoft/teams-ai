"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

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
        self.name = name
        self.data = data
