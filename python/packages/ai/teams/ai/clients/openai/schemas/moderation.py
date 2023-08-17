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
        def from_json(cls, data: Dict[str, Any]) -> "CreateModerationResponse.Result":
            return CreateModerationResponse.Result(
                flagged=data["flagged"],
                categories=data["categories"],
                category_scores=data["category_scores"],
            )

        def to_dict(self) -> Dict[str, Any]:
            return self.__dict__

    id: str
    model: str
    results: List[Result]

    @classmethod
    def from_json(cls, data: Dict[str, Any]) -> "CreateModerationResponse":
        results: List[Any] = data["results"]

        return CreateModerationResponse(
            id=data["id"],
            model=data["model"],
            results=list(map(CreateModerationResponse.Result.from_json, results)),
        )

    def to_dict(self) -> Dict[str, Any]:
        return self.__dict__
