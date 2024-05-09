"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from __future__ import annotations

import json
import re
from typing import Any, List, Optional

import yaml

from .citations.citations import ClientCitation
from .tokenizers import Tokenizer


def to_string(tokenizer: Tokenizer, value: Any, as_json: bool = False) -> str:
    """
    Converts a value to a string representation.
    Dates are converted to ISO strings and Objects are converted to JSON or YAML,
    whichever is shorter.

    Args:
        tokenizer (Tokenizer): The tokenizer object used for encoding.
        value (Any): The value to be converted.
        as_json (bool, optional): Flag indicating whether to return the value as JSON string.
          Defaults to False.

    Returns:
        str: The string representation of the value.
    """
    if value is None:
        return ""

    if hasattr(value, "__dict__"):
        value = value.__dict__

    if isinstance(value, str):
        return value
    if hasattr(value, "isoformat") and callable(value.isoformat):
        # Used when the value is a datetime object
        return value.isoformat()

    if as_json:
        return json.dumps(value, default=lambda o: o.__dict__)

    # Return shorter version of object
    yaml_str = yaml.dump(value)
    json_str = json.dumps(value, default=lambda o: o.__dict__)
    if len(tokenizer.encode(yaml_str)) < len(tokenizer.encode(json_str)):
        return yaml_str

    return json_str

def snippet(text: str, maxLength: int) -> str:
    """
    Clips the text to a maximum length in case it exceeds the limit.

    Args:
        text: str The text to clip.
        maxLength The maximum length of the text to return, cutting off the last whole word.

    Returns:
        str: The modified text
     """
    if len(text) <= maxLength:
        return text
    snippet = text[:maxLength]
    snippet = snippet[:max(snippet.rfind(' '), -1)]
    snippet += '...'
    return snippet



def format_citations_response(text: str) -> str:
    """
    Convert citation tags `[doc(s)n]` to `[n]` where n is a number.
    Args:
        text: str The text to format.
    Returns:
        str: The modified text
    """
    return re.sub(r'\[docs?(\d+)\]', r'[\1]', text, flags=re.IGNORECASE)

def get_used_citations(text: str, citations: List[ClientCitation]) -> Optional[List[ClientCitation]]:
    """
    Get the citations used in the text. This will remove any citations that are included in the citations array from the response but not referenced in the text.
    Args:
        text: str The text to search for citations.
        citations: List[ClientCitation] The list of citations to search for.
    Returns:
        Optional[List[ClientCitation]]: The list of citations used in the text.
    """
    regex = r"\[(\d+)\]"
    matches = re.findall(regex, text)

    if not matches:
        return None
    else:
        used_citations = []
        for match in matches:
            for citation in citations:
                if citation.position == match:
                    used_citations.append(citation)
                    break
        return used_citations