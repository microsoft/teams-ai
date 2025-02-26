"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

import re
from typing import List, Optional, Union, Dict, Any

from teams.ai.citations import ClientCitation


def get_used_citations(
    text: str, citations: List[Union[ClientCitation, Dict[str, Any]]]
) -> Optional[List[Union[ClientCitation, Dict[str, Any]]]]:
    """
    Get the citations used in the text. This will remove any citations that are
    included in the citations array from the response but not referenced in the text.
    Args:
        text: str The text to search for citations.
        citations: List[Union[ClientCitation, Dict[str, Any]]] The list of citations to search for.
                  Supports both ClientCitation objects and dictionary representations.
    Returns:
        Optional[List[Union[ClientCitation, Dict[str, Any]]]]: The list of citations used in the 
        text.
    """
    regex = r"\[(\d+)\]"
    matches = re.findall(regex, text)

    if not matches:
        return None

    used_citations: List[Union[ClientCitation, Dict[str, Any]]] = []  # Explicitly type this
    processed_matches = []
    for match in matches:
        if match in processed_matches:
            continue
        processed_matches.append(match)

        for citation in citations:
            if isinstance(citation, ClientCitation) and str(citation.position) == match:
                used_citations.append(citation)
                break
            if isinstance(citation, dict) and str(citation["position"]) == match:
                used_citations.append(citation)
                break

    return used_citations
