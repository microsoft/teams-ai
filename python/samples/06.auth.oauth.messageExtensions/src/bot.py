"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.

Description: initialize the app and listen for `message` activitys
"""

import sys
import traceback

from typing import List

from msgraph import GraphServiceClient, GraphRequestAdapter
from botbuilder.core import MemoryStorage, TurnContext, CardFactory
from botbuilder.schema import ThumbnailCard, CardImage, Attachment
from botbuilder.schema.teams import MessagingExtensionQuery, MessagingExtensionResult, MessagingExtensionParameter

from teams import Application, ApplicationOptions, TeamsAdapter
from teams.auth import AuthOptions, OAuthOptions, SignInResponse
from teams.state import ConversationState, TempState, TurnState, UserState

from config import Config
from graph import GraphAuthenticationProvider

config = Config()
app = Application[TurnState[ConversationState, UserState, TempState]](
    ApplicationOptions(
        bot_app_id=config.APP_ID,
        storage=MemoryStorage(),
        adapter=TeamsAdapter(config),
        auth=AuthOptions(
            default="graph",
            auto=lambda ctx: (
                ctx.activity.value is None or
                ((
                    "commandId" in ctx.activity.value and
                    ctx.activity.value["commandId"] != "signOutCommand"
                ) or (
                    "command_id" in ctx.activity.value and
                    ctx.activity.value["command_id"] != "signOutCommand"
                ))
            ),
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


@app.message_extensions.query("searchCmd")
async def on_search_command(
    context: TurnContext,
    state: TurnState[ConversationState, UserState, TempState],
    query: MessagingExtensionQuery
):
    params: List[MessagingExtensionParameter] = query.parameters or []
    res: List[Attachment] = []
    q = [param for param in params if param.name == "queryText"][0].value
    token = await app.auth.get("graph").get_token(context)

    if token is None:
        return MessagingExtensionResult()
    
    graph = GraphServiceClient(
        request_adapter=GraphRequestAdapter(
            GraphAuthenticationProvider(token)
        )
    )

    if q == "profile":
        me = await graph.me.get()
        
        if me:
            res.append(CardFactory.thumbnail_card(ThumbnailCard(
                title=me.display_name or "",
                images=[CardImage(url=me.photo.)] if me.photo else None
            )))

    return MessagingExtensionResult(
        type="result",
        attachments=res,
        attachment_layout="list",
    )


@app.auth.get("graph").on_sign_in_success
async def on_sign_in_success(
    context: TurnContext, state: TurnState[ConversationState, UserState, TempState]
):
    await context.send_activity("successfully logged in!")
    await context.send_activity(f"token: {state.temp.auth_tokens['graph']}")


@app.auth.get("graph").on_sign_in_failure
async def on_sign_in_failure(
    context: TurnContext,
    state: TurnState[ConversationState, UserState, TempState],
    res: SignInResponse,
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
