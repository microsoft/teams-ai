"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from typing import cast
from unittest import IsolatedAsyncioTestCase

from botbuilder.core import TurnContext

from teams.ai.moderators import DefaultModerator
from teams.ai.planners import Plan
from teams.state import TurnState


class TestDefaultModerator(IsolatedAsyncioTestCase):
    moderator = DefaultModerator()

    async def test_review_input(self):
        plan = await self.moderator.review_input(context=cast(TurnContext, {}), state=TurnState())

        self.assertIsNone(plan)

    async def test_review_output(self):
        plan = Plan()
        output = await self.moderator.review_output(
            context=cast(TurnContext, {}), state=TurnState(), plan=plan
        )

        self.assertEqual(output, plan)
