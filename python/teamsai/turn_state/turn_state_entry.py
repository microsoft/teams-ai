"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from typing import TypeVar, Generic, TypedDict, Union

T = TypeVar("T", TypedDict)


class TurnStateEntry(Generic[T]):
    "accessor class for managing an individual state scope"

    __value: T
    __storage_key: Union[str, None]
    __deleted = False
    __hash: str

    def __init__(self, value: T, storage_key=None) -> None:
        self.__value = value
        self.__storage_key = storage_key
        self.__hash = value.__str__()

    @property
    def changed(self) -> bool:
        "gets a value indicating whether the state scope has changed since it was last loaded"

        return self.__hash != str(self.__value)

    @property
    def deleted(self) -> bool:
        "gets the value indicating whether the state scope has been deleted"

        return self.__deleted

    @property
    def value(self) -> T:
        "gets the value of the state scope"

        if self.__deleted:
            self.__value = {}
            self.__deleted = False

        return self.__value

    @property
    def storage_key(self) -> Union[str, None]:
        "gets the storage key used to persist the state scope"

        return self.__storage_key

    def delete(self) -> None:
        "clears the state scope"

        self.__deleted = True

    def replace(self, value: T) -> None:
        "replaces the state scope with a new value"

        self.__value = value
