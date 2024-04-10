"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.

Description: initialize the app and listen for `message` activitys
"""

import sys
import os
import traceback

from botbuilder.core import TurnContext
from teams import Application, ApplicationOptions, TeamsAdapter
from teams.state import TurnState
from teams.auth import AuthOptions, OAuthOptions

from config import Config

config = Config()
app = Application[TurnState](
    ApplicationOptions(
        bot_app_id=config.APP_ID,
        adapter=TeamsAdapter(config),
        auth=AuthOptions(
            default="graph",
            auto=True,
            settings={
                "graph": OAuthOptions(
                    connection_name=config.OAUTH_CONNECTION_NAME,
                    title="Sign In",
                    text="please sign in",
                    end_on_invalid_message=True,
                    enable_sso=True,
                ),
            },
        ),
    )
)

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
