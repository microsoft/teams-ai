"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from dataclasses import dataclass
from typing import List, Literal, Optional

EmbeddingsResponseStatus = Literal[
    "success",  # The embeddings were successfully created.
    "error",  # An error occurred while creating the embeddings.
    "rate_limited",  # The request was rate limited.
]


@dataclass
class EmbeddingsResponse:
    """
    Response returned for embeddings.
    """

    status: EmbeddingsResponseStatus
    "Status of the embeddings response."

    output: Optional[List[List[int]]] = None
    "Optional. Embeddings for the given inputs."

    message: Optional[str] = None
    "Optional. Message status."
