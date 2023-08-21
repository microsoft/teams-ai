"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from typing import Generic, Optional, TypeVar

ValueT = TypeVar("ValueT")


class TurnStateEntry(Generic[ValueT]):
    "accessor class for managing an individual state scope"

    _value: ValueT
    _storage_key: Optional[str]
    _hash: str
    _deleted = False

    def __init__(self, value: ValueT, storage_key: Optional[str] = None) -> None:
        self._value = value
        self._storage_key = storage_key
        self._hash = str(self._value)

    @property
    def has_changed(self) -> bool:
        "gets a value indicating whether the state scope has changed since it was last loaded"

        return self._hash != str(self._value)

    @property
    def is_deleted(self) -> bool:
        "gets the value indicating whether the state scope has been deleted"

        return self._deleted

    @property
    def storage_key(self) -> Optional[str]:
        "gets the storage key used to persist the state scope"

        return self._storage_key

    @property
    def value(self) -> ValueT:
        "gets the value of the state scope"

        if self.is_deleted:
            self._deleted = False

        return self._value

    def replace(self, value: ValueT):
        "sets the value of the state scope"

        self._value = value
        self._deleted = False

    def delete(self):
        "delete state scope"

        self._deleted = True
