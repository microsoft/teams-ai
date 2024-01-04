
"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from dataclasses import dataclass
from typing import Optional

@dataclass
class InputFile:
    content: bytes
    content_type: str
    content_url: Optional[str]