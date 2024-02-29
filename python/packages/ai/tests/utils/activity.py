"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from botbuilder.schema import Activity, ChannelAccount, ConversationAccount

ACTIVITY = Activity(
    id="1234",
    type="message",
    text="test",
    from_property=ChannelAccount(id="user", name="User Name"),
    recipient=ChannelAccount(id="bot", name="Bot Name"),
    conversation=ConversationAccount(id="convo", name="Convo Name"),
    channel_id="UnitTest",
    locale="en-uS",
    service_url="https://example.org",
)
