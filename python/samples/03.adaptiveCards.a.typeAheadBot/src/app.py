"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

import re

import aiohttp
import uvicorn
from botbuilder.core import MemoryStorage, TurnContext
from botbuilder.integration.aiohttp import ConfigurationBotFrameworkAuthentication
from botbuilder.schema import Activity
from fastapi import FastAPI, Request, Response
from teams import Application, ApplicationOptions, Query, TurnState
from teams.adaptive_cards import AdaptiveCardsSearchParams, AdaptiveCardsSearchResult

from src.cards.dynamic_search_card import create_dynamic_search_card
from src.cards.static_search_card import create_static_search_card
from src.config import Config

# Initialize Teams AI application
storage = MemoryStorage()
app = Application[TurnState](
    ApplicationOptions(
        auth=ConfigurationBotFrameworkAuthentication(Config),
        storage=storage,
    )
)


@app.message(re.compile(r"dynamic", re.IGNORECASE))
async def dynamic_card(context: TurnContext, _state: TurnState) -> bool:
    attachment = create_dynamic_search_card()
    await context.send_activity(Activity(attachments=[attachment]))
    return True


@app.message(re.compile(r"static", re.IGNORECASE))
async def static_card(context: TurnContext, _state: TurnState) -> bool:
    attachment = create_static_search_card()
    await context.send_activity(Activity(attachments=[attachment]))
    return True


@app.adaptive_cards.search("npmpackages")
async def search_npm_package(
    _context: TurnContext, _state: TurnState, query: Query[AdaptiveCardsSearchParams]
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
                    obj["package"]["name"],
                    f"{obj['package']['name']} - {obj['package'].get('description','')}",
                )
                npm_packages.append(result)
            return npm_packages


@app.adaptive_cards.action_submit("DynamicSubmit")
async def on_dynamic_submit(context: TurnContext, _state: TurnState, data) -> None:
    await context.send_activity(f'Dynamically selected option is: {data["choiceSelect"]}')


@app.adaptive_cards.action_submit("StaticSubmit")
async def on_static_submit(context: TurnContext, _state: TurnState, data) -> None:
    await context.send_activity(f'Statically selected option is: {data["choiceSelect"]}')


# Create API to receive messages from Teams
api = FastAPI()


@api.post("/api/messages")
async def on_message(req: Request, res: Response):
    body = await req.json()
    activity = Activity().deserialize(body)
    auth_header = req.headers["Authorization"] if "Authorization" in req.headers else ""
    response = await app.process_activity(activity, auth_header)

    if response:
        res.status_code = response.status
        return response.body


# Run the app
if __name__ == "__main__":
    uvicorn.run(api, port=Config.PORT)
