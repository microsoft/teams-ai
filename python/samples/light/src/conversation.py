"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from teams.ai.state import ConversationState


class AppConversationState(ConversationState):
    lights_on: bool = False
