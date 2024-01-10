"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""
from typing import Dict, Any, Optional

class TurnStateEntry:
    _value: Dict[str, Any]
    _storage_key: Optional[str]
    _deleted: bool = False
    _hash: str

    def __init__(self, value: Optional[Dict[str, Any]] = None, storage_key: Optional[str] = None):
        self._value = value or dict()
        self._storage_key = storage_key
        self._hash = str(self._value)

    @property
    def has_changed(self) -> bool:
        return str(self._value) != self._hash
    
    @property
    def is_deleted(self) -> bool:
        return self._deleted
    
    @property
    def value(self) -> Dict[str, Any]:
        if self._deleted:
            # Switch to a replace scenario
            self._value = dict()
            self._deleted = False

        return self._value
    
    @property
    def storage_key(self) -> Optional[str]:
        return self._storage_key
    
    def delete(self) -> None:
        self._deleted = True

    def replace(self, value: Optional[Dict[str, Any]] = None) -> None:
        self._value = value or dict()

    