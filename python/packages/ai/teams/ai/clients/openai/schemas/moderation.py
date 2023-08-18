"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from dataclasses import dataclass
from typing import Any, Dict, List


@dataclass
class CreateModerationResponse:
    @dataclass
    class Result:
        flagged: bool
        categories: Dict[str, bool]
        category_scores: Dict[str, int]

        @classmethod
        def from_dict(cls, data: Dict[str, Any]) -> "CreateModerationResponse.Result":
            return CreateModerationResponse.Result(
                flagged=data["flagged"],
                categories=data["categories"],
                category_scores=data["category_scores"],
            )

    id: str
    model: str
    results: List[Result]

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "CreateModerationResponse":
        results: List[Any] = data["results"]

        return CreateModerationResponse(
            id=data["id"],
            model=data["model"],
            results=list(map(CreateModerationResponse.Result.from_dict, results)),
        )
