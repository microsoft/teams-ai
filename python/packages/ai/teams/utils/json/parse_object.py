"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from __future__ import annotations

import json
from typing import Any, Optional


def parse_object(text: str) -> Optional[Any]:
    """
    Parse JSON Object
    """

    start_brace = text.find("{")

    if start_brace == -1:
        return None

    obj = text[start_brace:]
    nesting = ["}"]
    cleaned = "{"
    in_string = False
    i = 1

    while i < len(obj) and len(nesting) > 0:
        char = obj[i]

        if in_string:
            cleaned += char

            if char == "\\":
                while char == "\\":
                    i += 1
                    char = obj[i]

                if i < len(obj):
                    cleaned += obj[i]
                else:
                    return None
            elif char == '"':
                in_string = False
        else:
            add_pre = False
            add_post = False

            if char == '"':
                in_string = True
            elif char == "{":
                nesting.append("}")
            elif char == "[":
                nesting.append("]")
            elif char in ("}", "]"):
                close = nesting.pop()

                if close != char:
                    return None
            elif char == "<":
                add_pre = True
            elif char == ">":
                add_post = True

            if add_pre:
                cleaned += '"'

            cleaned += char

            if add_post:
                cleaned += '"'

        i += 1

    if len(nesting) > 0:
        nesting.reverse()
        cleaned += "".join(nesting)

    try:
        return json.loads(cleaned)
    except ValueError:
        return None
