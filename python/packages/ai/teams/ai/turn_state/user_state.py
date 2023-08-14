"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from dataclasses import dataclass


@dataclass
class UserState:
    """
    inherit a new interface from this base interface to strongly type
    the applications user state
    """
