"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from typing import List, Union

from teams.ai.embeddings.embeddings_response import EmbeddingsResponse

from ...user_agent import _UserAgent


class EmbeddingsModel(ABC, _UserAgent):
    """
    An AI model that can be used to create embeddings.
    """

    @abstractmethod
    async def create_embeddings(
        self, inputs: Union[str, List[str], List[int], List[List[int]]]
    ) -> EmbeddingsResponse:
        """
        Creates embeddings for the given inputs.

        Args:
            inputs (Union[str, List[str],
            List[int], List[List[int]]]): Text inputs to create embeddings for.

        Returns:
            EmbeddingsResponse: A status and embeddings/message when an error occurs.
        """
