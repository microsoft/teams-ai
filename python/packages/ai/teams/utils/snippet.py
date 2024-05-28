"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from __future__ import annotations


def snippet(text: str, max_length: int) -> str:
    """
    Clips the text to a maximum length in case it exceeds the limit.

    Args:
        text: str The text to clip.
        maxLength The maximum length of the text to return, cutting off the last whole word.

    Returns:
        str: The modified text
    """
    if len(text) <= max_length:
        return text
    snippet = text[:max_length]
    snippet = snippet[: max(snippet.rfind(" "), -1)]
    snippet += "..."
    return snippet
