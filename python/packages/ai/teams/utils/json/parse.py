"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from typing import Any, List

from .parse_object import parse_object


def parse(text: str) -> List[Any]:
    """
    Parse all objects from a response string.
    """

    objects: List[Any] = []
    lines = text.split("\n")

    for line in lines:
        obj = parse_object(line)

        if obj is not None:
            objects.append(obj)

    if len(objects) == 0:
        obj = parse_object(text)

        if obj is not None:
            objects.append(obj)

    return objects
