"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from typing import List
from unittest import IsolatedAsyncioTestCase

from botbuilder.core import BotAdapter
from botbuilder.schema import Activity, ActivityTypes, ResourceResponse

from .activity import ACTIVITY


class SimpleAdapter(BotAdapter, IsolatedAsyncioTestCase):
    async def send_activities(self, context, activities) -> List[ResourceResponse]:
        responses = []

        self.assertIsNotNone(context)
        self.assertIsNotNone(activities)
        self.assertIsInstance(activities, list)

        for _, activity in enumerate(activities):
            self.assertIsInstance(activity, Activity)
            self.assertIn(activity.type, [ActivityTypes.message, ActivityTypes.trace])
            responses.append(ResourceResponse(id="5678"))
        return responses

    async def update_activity(self, context, activity):
        self.assertIsNotNone(context)
        self.assertIsNotNone(activity)
        return ResourceResponse(id=activity.id)

    async def delete_activity(self, context, reference):
        self.assertIsNotNone(context)
        self.assertIsNotNone(reference)
        self.assertEqual(reference.activity_id, ACTIVITY.id)
