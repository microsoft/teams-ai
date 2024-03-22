"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.

Description: initialize the app and listen for activities.
"""

import re
import sys
import traceback

import aiohttp
from botbuilder.core import MemoryStorage, TurnContext
from botbuilder.schema import Activity
from teams import Application, Query, TeamsAdapter, ApplicationOptions
from teams.adaptive_cards import AdaptiveCardsSearchParams, AdaptiveCardsSearchResult

from cards.static_search_card import create_static_search_card
from cards.dynamic_search_card import create_dynamic_search_card
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

@app.message(re.compile(r"static", re.IGNORECASE))
async def static_card(context: TurnContext, _state: AppTurnState) -> bool:
    attachment = create_static_search_card()
    await context.send_activity(Activity(attachments=[attachment]))
    return True

@app.adaptive_cards.action_submit("StaticSubmit")
async def on_static_submit(context: TurnContext, _state: AppTurnState, data) -> None:
    await context.send_activity(f'Statically selected option is: {data["choiceSelect"]}')

@app.adaptive_cards.action_submit("DynamicSubmit")
async def on_dynamic_submit(context: TurnContext, _state: AppTurnState, data) -> None:
    await context.send_activity(f'Dynamically selected option is: {data["choiceSelect"]}')

@app.adaptive_cards.search("npmpackages")
async def search_npm_package(
    _context: TurnContext, _state: AppTurnState, query: Query[AdaptiveCardsSearchParams]
):
    search_query = query.parameters.query_text
    count = query.count
    async with aiohttp.ClientSession() as session:
        async with session.get(
            f"http://registry.npmjs.com/-/v1/search?text={search_query}&size={count})"
        ) as response:
            data = await response.json()
            npm_packages = []
            for obj in data["objects"]:
                result = AdaptiveCardsSearchResult(
                    title= obj["package"]["name"],
                    value= f"{obj['package']['name']} - {obj['package'].get('description','')}",
                )
                npm_packages.append(result)
            return npm_packages

@app.message(re.compile(r"dynamic", re.IGNORECASE))
async def dynamic_card(context: TurnContext, _state: AppTurnState) -> bool:
    attachment = create_dynamic_search_card()
    await context.send_activity(Activity(attachments=[attachment]))
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