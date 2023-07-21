"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

import abc
from typing import TypeVar, Generic, TypedDict, Union
from botbuilder.core import TurnContext, Storage
from .turn_state_entry import TurnStateEntry


class TurnState(TypedDict):
    "base interface defining a collection of turn state scopes"

    key: str
    value: TurnStateEntry


T = TypeVar("T", TurnState)


class TurnStateManager(Generic[T], abc.ABC):
    "interface implemented by classes responsible for loading and saving an application turn state"

    @abc.abstractmethod
    async def load_state(self, storage: Union[Storage, None],
                         context: TurnContext) -> T:
        "loads all of the state scopes for the current turn"

    @abc.abstractmethod
    async def save_state(self, storage: Union[Storage, None],
                         context: TurnContext, state: T) -> None:
        "saves all of the state scopes for the current turn"
