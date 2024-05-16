"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Dict, Generic, List, Optional, TypeVar, Union

import azure.ai.contentsafety
from azure.ai.contentsafety import models
from azure.core.credentials import AzureKeyCredential
from azure.core.exceptions import HttpResponseError
from botbuilder.core import TurnContext

from ...app_error import ApplicationError
from ...state import TurnState
from ..actions.action_types import ActionTypes
from ..planners.plan import Plan, PredictedDoCommand, PredictedSayCommand
from .moderator import Moderator
from .openai_moderator import OpenAIModeratorOptions

StateT = TypeVar("StateT", bound=TurnState)


@dataclass
class AzureContentSafetyModeratorOptions(OpenAIModeratorOptions):
    """
    Options for the OpenAI based moderator.
    """

    api_version: Optional[str] = None
    "Optional. Azure Content Safety API version."

    categories: List[Union[str, models.TextCategory]] = field(
        default_factory=lambda: [
            models.TextCategory.HATE,
            models.TextCategory.SEXUAL,
            models.TextCategory.SELF_HARM,
            models.TextCategory.VIOLENCE,
        ]
    )
    "Optional. Azure Content Safety Categories. Default: all"

    blocklist_names: Optional[List[str]] = None
    """
    Text blocklist Name. Only support following characters: 0-9 A-Z a-z - . _ ~.
    You could attach multiple lists name here.
    """


class AzureContentSafetyModerator(Generic[StateT], Moderator[StateT]):
    """
    An Azure OpenAI moderator that uses OpenAI's moderation API
    to review prompts and plans for safety.
    """

    _options: AzureContentSafetyModeratorOptions
    _client: azure.ai.contentsafety.ContentSafetyClient

    @property
    def options(self) -> AzureContentSafetyModeratorOptions:
        return self._options

    def __init__(self, options: AzureContentSafetyModeratorOptions) -> None:
        """
        Creates a new instance of the Azure OpenAI based moderator.

        Args:
            options (AzureContentSafetyModeratorOptions): options for the moderator.
        """

        if options.endpoint is None:
            raise ApplicationError(
                "options.endpoint is required when using AzureContentSafetyModerator"
            )

        self._options = options
        self._client = azure.ai.contentsafety.ContentSafetyClient(
            endpoint=options.endpoint,
            api_version=options.api_version,
            credential=AzureKeyCredential(options.api_key),
        )

    async def review_input(self, context: TurnContext, state: StateT) -> Optional[Plan]:
        if self._options.moderate == "output":
            return None

        input = state.temp.input if state.temp.input != "" else context.activity.text

        try:
            res = self._client.analyze_text(
                options=models.AnalyzeTextOptions(
                    text=input,
                    categories=self._options.categories,
                    blocklist_names=self._options.blocklist_names,
                )
            )

            flagged: bool = False
            categories: Dict[str, bool] = {}
            category_scores: Dict[str, int] = {}

            category_results = ["hateResult", "selfHarmResult", "sexualResult", "violenceResult"]

            for category in category_results:
                result = res[category] if category in res else None
                if result is not None:
                    category = result["category"].lower()
                    if category == "selfharm":
                        category = "self_harm"
                    categories[category] = result["severity"] is not None and result["severity"] > 0
                    category_scores[category] = (
                        0 if result["severity"] is None else result["severity"]
                    )
                    if result["severity"] is not None and result["severity"] > 0:
                        flagged = True

            return (
                None
                if not flagged
                else Plan(
                    commands=[
                        PredictedDoCommand(
                            action=ActionTypes.FLAGGED_INPUT,
                            parameters={
                                "flagged": flagged,
                                "categories": categories,
                                "category_scores": category_scores,
                            },
                        )
                    ]
                )
            )
        except HttpResponseError as err:
            return Plan(
                commands=[
                    PredictedDoCommand(action=ActionTypes.HTTP_ERROR, parameters=err.__dict__)
                ]
            )

    async def review_output(self, context: TurnContext, state: StateT, plan: Plan) -> Plan:
        if self._options.moderate == "input":
            return plan

        for cmd in plan.commands:
            if isinstance(cmd, PredictedSayCommand):
                try:
                    res = self._client.analyze_text(
                        options=models.AnalyzeTextOptions(
                            text=(
                                cmd.response.content
                                if cmd.response and cmd.response.content is not None
                                else ""
                            ),
                            categories=self._options.categories,
                            blocklist_names=self._options.blocklist_names,
                        )
                    )

                    flagged: bool = False
                    categories: Dict[str, bool] = {}
                    category_scores: Dict[str, int] = {}

                    category_results = [
                        "hateResult",
                        "selfHarmResult",
                        "sexualResult",
                        "violenceResult",
                    ]

                    for category in category_results:
                        result = res[category] if category in res else None
                        if result is not None:
                            category = result["category"].lower()
                            if category == "selfharm":
                                category = "self_harm"
                            categories[category] = (
                                result["severity"] is not None and result["severity"] > 0
                            )
                            category_scores[category] = (
                                0 if result["severity"] is None else result["severity"]
                            )
                            if result["severity"] is not None and result["severity"] > 0:
                                flagged = True

                    if flagged:
                        return Plan(
                            commands=[
                                PredictedDoCommand(
                                    action=ActionTypes.FLAGGED_OUTPUT,
                                    parameters={
                                        "flagged": flagged,
                                        "categories": categories,
                                        "category_scores": category_scores,
                                    },
                                )
                            ]
                        )
                except HttpResponseError as err:
                    return Plan(
                        commands=[
                            PredictedDoCommand(
                                action=ActionTypes.HTTP_ERROR, parameters=err.__dict__
                            )
                        ]
                    )
        return plan
