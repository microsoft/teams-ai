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
            if isinstance(key, str) and key.startswith("__"):
                continue

            data[key] = todict(val)
        return data

    if isinstance(value, list):
        return [todict(v) for v in value]

    if isinstance(value, object) and hasattr(value, "__dict__"):
        return todict(value.__dict__)

    return value
