"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from __future__ import annotations

from dataclasses import dataclass


@dataclass
class AdaptiveCardsSearchResult(dict):
    title: str
    value: str

    def __init__(self, title, value):
        dict.__init__(self, title=title, value=value)
