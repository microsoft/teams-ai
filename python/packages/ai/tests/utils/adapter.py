"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from typing import List

from botbuilder.core import BotAdapter
from botbuilder.schema import Activity, ResourceResponse

from .activity import ACTIVITY


class SimpleAdapter(BotAdapter):
    async def send_activities(self, context, activities) -> List[ResourceResponse]:
        responses = []

        assert context is not None
        assert activities is not None
        assert isinstance(activities, list)

        for _, activity in enumerate(activities):
            assert isinstance(activity, Activity)
            responses.append(ResourceResponse(id="5678"))

        return responses

    async def update_activity(self, context, activity):
        assert context is not None
        assert activity is not None
        return ResourceResponse(id=activity.id)

    async def delete_activity(self, context, reference):
        assert context is not None
        assert reference is not None
        assert reference.activity_id == ACTIVITY.id
