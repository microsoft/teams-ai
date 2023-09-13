"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from dataclasses import dataclass


@dataclass
class AdaptiveCardsSearchParams:
    query_text: str
    dataset: str
