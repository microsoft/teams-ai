"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

import re
from typing import List, Optional

from teams.ai.citations import ClientCitation


def get_used_citations(
    text: str, citations: List[ClientCitation]
) -> Optional[List[ClientCitation]]:
    """
    Get the citations used in the text. This will remove any citations that are
    included in the citations array from the response but not referenced in the text.
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

    used_citations = []
    for match in matches:
        for citation in citations:
            if citation.position == match:
                used_citations.append(citation)
                break
    return used_citations
