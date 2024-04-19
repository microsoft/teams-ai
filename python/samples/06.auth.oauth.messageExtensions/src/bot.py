"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.

Description: initialize the app and listen for `message` activitys
"""

import sys
import traceback
import base64

from typing import List, Any

from msgraph import GraphServiceClient
from botbuilder.core import MemoryStorage, TurnContext, CardFactory
from botbuilder.schema import ThumbnailCard, CardImage
from botbuilder.schema.teams import MessagingExtensionQuery, MessagingExtensionResult, MessagingExtensionParameter, MessagingExtensionAttachment, TaskModuleTaskInfo

from teams import Application, ApplicationOptions, TeamsAdapter
from teams.auth import AuthOptions, OAuthOptions
from teams.state import ConversationState, TempState, TurnState, UserState

from config import Config
from graph import GraphTokenProvider

config = Config()
app = Application[TurnState[ConversationState, UserState, TempState]](
    ApplicationOptions(
        bot_app_id=config.APP_ID,
        storage=MemoryStorage(),
        adapter=TeamsAdapter(config),
        auth=AuthOptions(
            default="graph",
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


@app.message_extensions.fetch_task("signOutCommand")
async def on_sign_out_fetch(
    context: TurnContext,
    state: TurnState[ConversationState, UserState, TempState]
):
    await app.auth.get("graph").sign_out(context, state)
    return TaskModuleTaskInfo(
        title="Adaptive Card: Inputs",
        height=100,
        width=400,
        card=CardFactory.adaptive_card({
            "version": "1.0.0",
            "type": "AdaptiveCard",
            "body": [{
                "type": "TextBlock",
                "text": "You have been signed out."
            }],
            "actions": [{
                "type": "Action.Submit",
                "title": "Close",
                "data": { "key": "close" }
            }]
        })
    )


@app.message_extensions.submit_action("signOutCommand")
async def on_sign_out_submit(
    _context: TurnContext,
    _state: TurnState[ConversationState, UserState, TempState],
    _data: Any
):
    return None


@app.message_extensions.query("searchCmd")
async def on_search(
    context: TurnContext,
    state: TurnState[ConversationState, UserState, TempState],
    query: MessagingExtensionQuery
):
    params: List[MessagingExtensionParameter] = query.parameters or []
    res: List[MessagingExtensionAttachment] = []
    q = [param for param in params if param.name == "queryText"][0].value
    token = await app.auth.get("graph").sign_in(context, state)

    if token is None:
        return MessagingExtensionResult()
    
    graph = GraphServiceClient(GraphTokenProvider(token))

    if q == "profile":
        me = await graph.me.get()
        photo = await graph.me.photo.content.get()

        if me:
            res.append(MessagingExtensionAttachment(
                content_type=CardFactory.content_types.thumbnail_card,
                content=ThumbnailCard(
                    title=me.display_name or "",
                    images=[CardImage(url="data:image/png;base64,"+base64.b64encode(photo).decode("ascii"))]
                )
            ))

    return MessagingExtensionResult(
        type="result",
        attachments=res,
        attachment_layout="list",
    )


@app.error
async def on_error(context: TurnContext, error: Exception):
    # This check writes out errors to console log .vs. app insights.
    # NOTE: In production environment, you should consider logging this to Azure
    #       application insights.
    print(f"\n [on_turn_error] unhandled error: {error}", file=sys.stderr)
    traceback.print_exc()

    # Send a message to the user
    await context.send_activity("The bot encountered an error or bug.")
