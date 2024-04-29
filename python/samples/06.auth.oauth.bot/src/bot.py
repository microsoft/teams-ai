"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.

Description: initialize the app and listen for `message` activitys
"""

import sys
import traceback

from botbuilder.core import MemoryStorage, TurnContext
from teams import Application, ApplicationOptions, TeamsAdapter
from teams.auth import AuthOptions, OAuthOptions, SignInResponse
from teams.state import ConversationState, TempState, TurnState, UserState

from config import Config

config = Config()
app = Application[TurnState[ConversationState, UserState, TempState]](
    ApplicationOptions(
        bot_app_id=config.APP_ID,
        storage=MemoryStorage(),
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

auth = app.auth.get("graph")


@app.message("/signout")
async def on_sign_out(
    context: TurnContext, state: TurnState[ConversationState, UserState, TempState]
):
    await auth.sign_out(context, state)
    await context.send_activity("you are now signed out...👋")
    return False


@app.activity("message")
async def on_message(
    context: TurnContext, _state: TurnState[ConversationState, UserState, TempState]
):
    await context.send_activity(f"you said: {context.activity.text}")
    return False


@auth.on_sign_in_success
async def on_sign_in_success(
    context: TurnContext, state: TurnState[ConversationState, UserState, TempState]
):
    await context.send_activity("successfully logged in!")
    await context.send_activity(f"token: {state.temp.auth_tokens['graph']}")


@auth.on_sign_in_failure
async def on_sign_in_failure(
    context: TurnContext,
    _state: TurnState[ConversationState, UserState, TempState],
    _res: SignInResponse,
):
    await context.send_activity("failed to login...")


@app.error
async def on_error(context: TurnContext, error: Exception):
    # This check writes out errors to console log .vs. app insights.
    # NOTE: In production environment, you should consider logging this to Azure
    #       application insights.
    print(f"\n [on_turn_error] unhandled error: {error}", file=sys.stderr)
    traceback.print_exc()

    # Send a message to the user
    await context.send_activity("The bot encountered an error or bug.")
