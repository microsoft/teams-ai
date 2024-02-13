"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from dataclasses import dataclass
from typing import Literal, Optional

import openai
from botbuilder.core import TurnContext

from ...state import TurnState
from ..actions import ActionTypes
from ..planner import Plan, PredictedDoCommand, PredictedSayCommand
from .moderator import Moderator


@dataclass
class OpenAIModeratorOptions:
    """
    Options for the OpenAI based moderator.
    """

    api_key: str
    "OpenAI API Key"

    moderate: Literal["input", "output", "both"] = "both"
    "Optional. Which parts of the conversation to moderate. Default: both"

    organization: Optional[str] = None
    "Optional. OpenAI organization."

    endpoint: Optional[str] = None
    "Optional. OpenAI endpoint."

    model: str = "text-moderation-latest"
    "Optional. OpenAI model to use. Default: text-moderation-latest"


class OpenAIModerator(Moderator):
    """
    A moderator that uses OpenAI's moderation API to review prompts and plans for safety.
    """

    _options: OpenAIModeratorOptions
    _client: openai.AsyncOpenAI

    @property
    def options(self) -> OpenAIModeratorOptions:
        return self._options

    def __init__(
        self, options: OpenAIModeratorOptions, client: Optional[openai.AsyncOpenAI] = None
    ) -> None:
        """
        Creates a new instance of the OpenAI based moderator.

        Args:
            options (OpenAIModeratorOptions): options for the moderator.
            client (Optional[openai.AsyncOpenAI]): Optional. client override
        """

        self._options = options
        self._client = (
            client
            if client is not None
            else openai.AsyncOpenAI(
                api_key=options.api_key,
                organization=options.organization,
                default_headers={"User-Agent": "teamsai-py/1.0.0"},
                base_url=options.endpoint,
            )
        )

    async def review_input(self, context: TurnContext, state: TurnState) -> Optional[Plan]:
        if self._options.moderate == "output":
            return None

        input = state.temp.input if state.temp.input != "" else context.activity.text

        try:
            res = await self._client.moderations.create(input=input, model=self._options.model)

            for result in res.results:
                if result.flagged:
                    return Plan(
                        commands=[
                            PredictedDoCommand(
                                action=ActionTypes.FLAGGED_INPUT, parameters=result.model_dump()
                            )
                        ]
                    )
            return None
        except openai.APIError as err:
            return Plan(
                commands=[
                    PredictedDoCommand(action=ActionTypes.HTTP_ERROR, parameters=err.__dict__)
                ]
            )

    async def review_output(self, context: TurnContext, state: TurnState, plan: Plan) -> Plan:
        if self._options.moderate == "input":
            return plan

        for cmd in plan.commands:
            if isinstance(cmd, PredictedSayCommand):
                try:
                    res = await self._client.moderations.create(
                        input=cmd.response, model=self._options.model
                    )

                    for result in res.results:
                        if result.flagged:
                            return Plan(
                                commands=[
                                    PredictedDoCommand(
                                        action=ActionTypes.FLAGGED_OUTPUT,
                                        parameters=result.model_dump(),
                                    )
                                ]
                            )
                except openai.APIError as err:
                    return Plan(
                        commands=[
                            PredictedDoCommand(
                                action=ActionTypes.HTTP_ERROR, parameters=err.__dict__
                            )
                        ]
                    )
        return plan
