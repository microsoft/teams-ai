"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.

Description: initialize the app and listen for activities.
"""

import sys
import traceback
from typing import Any, List

import aiohttp
from botbuilder.core import MemoryStorage, TurnContext
from botbuilder.schema.teams import (
    MessagingExtensionAttachment,
    MessagingExtensionQuery,
    MessagingExtensionResult,
)
from teams import Application, ApplicationOptions, TeamsAdapter

from cards.npm_package_card import create_npm_package_card
from cards.npm_search_result_card import create_npm_search_result_card
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
    )
)


@app.turn_state_factory
async def turn_state_factory(context: TurnContext):
    return await AppTurnState.load(context, storage)


@app.message_extensions.query("searchCmd")
async def search_command(
    _context: TurnContext, _state: AppTurnState, query: MessagingExtensionQuery
) -> MessagingExtensionResult:
    query_dict = query.as_dict()
    search_query = ""
    if query_dict["parameters"] is not None and len(query_dict["parameters"]) > 0:
        for parameter in query_dict["parameters"]:
            if parameter["name"] == "queryText":
                search_query = parameter["value"]
                break
    count = query_dict["query_options"]["count"] if query_dict["query_options"]["count"] else 10
    url = "http://registry.npmjs.com/-/v1/search?"
    params = {"size": count, "text": search_query}

    async with aiohttp.ClientSession() as session:
        async with session.get(url, params=params) as response:
            res = await response.json()

            results: List[MessagingExtensionAttachment] = []

            for obj in res["objects"]:
                results.append(create_npm_search_result_card(result=obj["package"]))

            return MessagingExtensionResult(
                attachment_layout="list", attachments=results, type="result"
            )


# Listen for item tap
@app.message_extensions.select_item()
async def select_item(_context: TurnContext, _state: AppTurnState, item: Any):
    card = create_npm_package_card(item)

    return MessagingExtensionResult(attachment_layout="list", attachments=[card], type="result")


@app.error
async def on_error(context: TurnContext, error: Exception):
    # This check writes out errors to console log .vs. app insights.
    # NOTE: In production environment, you should consider logging this to Azure
    #       application insights.
    print(f"\n [on_turn_error] unhandled error: {error}", file=sys.stderr)
    traceback.print_exc()

    # Send a message to the user
    await context.send_activity("The bot encountered an error or bug.")
