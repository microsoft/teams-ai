"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from botbuilder.core import (
    BotFrameworkAdapter,
    BotFrameworkAdapterSettings,
    TurnContext,
)
from config import Config
from teams import Application, ApplicationOptions, TurnState

config = Config()
settings = BotFrameworkAdapterSettings(config.app_id, config.app_password)
adapter = BotFrameworkAdapter(settings)
app = Application(ApplicationOptions(adapter=adapter, bot_app_id=config.app_id))


@app.activity("message")
async def on_message(context: TurnContext, _state: TurnState):
    await context.send_activity(f"you said: {context.activity.text}")
    return True
