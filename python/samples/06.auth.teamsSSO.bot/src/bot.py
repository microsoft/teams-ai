"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.

Description: initialize the app and listen for activities.
"""

import sys
import traceback

from botbuilder.core import MemoryStorage, TurnContext
from teams import Application, TeamsAdapter, ApplicationOptions
from teams.auth import AuthOptions, SsoOptions, ConfidentialClientApplicationOptions, SignInResponse

from config import Config
from state import AppTurnState

config = Config()

# Initialize Teams AI application
storage = MemoryStorage()
app = Application[AppTurnState](
    ApplicationOptions(
        bot_app_id=config.APP_ID,
        storage=storage,
        adapter=TeamsAdapter(config),
        auth=AuthOptions(
            auto=True,
            default="graph",
            settings={
                "graph": SsoOptions(
                    scopes=["User.Read"],
                    msal_config=ConfidentialClientApplicationOptions(
                        client_id=config.AAD_APP_CLIENT_ID,
                        client_secret=config.AAD_APP_CLIENT_SECRET,
                        authority=f"{config.AAD_APP_OAUTH_AUTHORITY_HOST}/{config.AAD_APP_TENANT_ID}"),
                    sign_in_link=f"https://{config.BOT_DOMAIN}/auth-start.html",
                    end_on_invalid_message=True
                ),
            },
        ),
    )
)

auth = app.auth.get("graph")

@app.turn_state_factory
async def turn_state_factory(context: TurnContext):
    return await AppTurnState.load(context, storage)

@app.message("/reset")
async def on_reset(
    context: TurnContext, state: AppTurnState
):
    del state.conversation
    await context.send_activity("Ok I've deleted the current conversation state")
    return True

@app.message("/signout")
async def on_sign_out(
    context: TurnContext, state: AppTurnState
):
    await app.auth.sign_out(context, state)
    await context.send_activity("you are now signed out...👋")
    return False

@app.activity("message")
async def on_message(
    context: TurnContext, state: AppTurnState
):
    curr_count = state.conversation.count
    state.conversation.count = curr_count + 1

    if "graph" in state.temp.auth_tokens:
        print(state.temp.auth_tokens['graph'])

    await context.send_activity(f"you said: {context.activity.text}")
    return False

@auth.on_sign_in_success
async def on_sign_in_success(
    context: TurnContext, state: AppTurnState
):
    await context.send_activity("successfully logged in!")
    await context.send_activity(f"token string length: {len(state.temp.auth_tokens['graph'])}")
    await context.send_activity(f"This is what you said before the AuthFlow started: {context.activity.text}");

@auth.on_sign_in_failure
async def on_sign_in_failure(
    context: TurnContext,
    _state: AppTurnState,
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
