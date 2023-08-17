"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.

Description: initialize the app and listen for `message` activitys
"""

import sys
import traceback

from botbuilder.core import (
    BotFrameworkAdapterSettings,
    TurnContext,
)
from teams import Application, ApplicationOptions, TurnState

from src.config import Config

config = Config()
app = Application(ApplicationOptions(
    bot_app_id=config.app_id,
    adapter=BotFrameworkAdapterSettings(config.app_id, config.app_password)
))


@app.activity("message")
async def on_message(context: TurnContext, _state: TurnState):
    await context.send_activity(f"you said: {context.activity.text}")
    return True


@app.error
async def on_error(context: TurnContext, error: Exception):
    # This check writes out errors to console log .vs. app insights.
    # NOTE: In production environment, you should consider logging this to Azure
    #       application insights.
    print(f"\n [on_turn_error] unhandled error: {error}", file=sys.stderr)
    traceback.print_exc()

    # Send a message to the user
    await context.send_activity("The bot encountered an error or bug.")
