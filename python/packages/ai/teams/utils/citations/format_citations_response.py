"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

import re


def format_citations_response(text: str) -> str:
    """
    Convert citation tags `[doc(s)n]` to `[n]` where n is a number.
    Args:
        text: str The text to format.
    Returns:
        str: The modified text
    """
    return re.sub(r"\[docs?(\d+)\]", r"[\1]", text, flags=re.IGNORECASE)
