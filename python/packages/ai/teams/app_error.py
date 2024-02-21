"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from __future__ import annotations


class ApplicationError(Exception):
    """
    Teams Application Error
    """

    def __init__(self, message: str) -> None:
        super().__init__(message)
