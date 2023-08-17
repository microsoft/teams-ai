"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from typing import Optional, TypeVar

from botbuilder.core import TurnContext

from teams.ai.action import DefaultActionTypes
from teams.ai.clients import OpenAIClient
from teams.ai.planner import Plan, PredictedDoCommand
from teams.ai.prompts import PromptTemplate
from teams.ai.state import TurnState

from .moderator import Moderator
from .openai_moderator_options import OpenAIModeratorOptions

StateT = TypeVar("StateT", bound=TurnState)


class OpenAIModerator(Moderator[StateT]):
    _options: OpenAIModeratorOptions
    _client: OpenAIClient

    def __init__(self, options: OpenAIModeratorOptions) -> None:
        self._options = options
        self._client = OpenAIClient(api_key=options.api_key, organization=options.organization)

    async def review_prompt(
        self, context: TurnContext, state: StateT, _prompt: PromptTemplate
    ) -> Optional[Plan]:
        if not self._options.moderate in ("input", "both"):
            return None

        input = state.temp.value["input"] if state.temp.value["input"] else context.activity.text
        res = await self._client.create_moderation(input, self._options.model)

        if not res:
            return Plan(commands=[PredictedDoCommand(action=DefaultActionTypes.RATE_LIMITED)])

        if len(res.data.results) > 0 and res.data.results[0].flagged:
            return Plan(
                commands=[
                    PredictedDoCommand(
                        action=DefaultActionTypes.FLAGGED_INPUT,
                        entities=res.data.results[0].to_dict(),
                    )
                ]
            )

        return None
