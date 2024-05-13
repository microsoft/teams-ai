"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from dataclasses import dataclass
from typing import Literal, Optional

SignInStatus = Literal["pending", "complete", "error"]
AuthErrorReason = Literal["completion-without-token", "invalid-activity", "other"]


@dataclass
class SignInResponse:
    status: SignInStatus
    reason: Optional[AuthErrorReason] = None
    message: Optional[str] = None
