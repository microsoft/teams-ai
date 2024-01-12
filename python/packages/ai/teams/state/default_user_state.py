"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from typing import Any, Dict


class DefaultUserState:
    _dict: Dict[str, Any]

    def __init__(self, data: Dict[str, Any]):
        self._dict = data

    def get_dict(self) -> Dict[str, Any]:
        return self._dict
