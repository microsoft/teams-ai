"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from __future__ import annotations

from typing import Any


def todict(value: Any) -> Any:
    """
    Converts a value to a
    dictionary recursively
    """

    if isinstance(value, dict):
        data = {}
        for key, val in value.items():
            if key.startswith("_"):
                continue
            data[key] = todict(val)
        return data
    if hasattr(value, "_ast"):
        return todict(value._ast())
    if hasattr(value, "__iter__") and not isinstance(value, str):
        return [todict(v) for v in value]
    if hasattr(value, "__dict__"):
        return todict(value.__dict__)
    return value
