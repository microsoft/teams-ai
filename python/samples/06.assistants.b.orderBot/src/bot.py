"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.

Description: initialize the app and listen for `message` activitys
"""

import json
import os
import sys
import traceback

from botbuilder.core import MemoryStorage, MessageFactory, TurnContext
from openai.types.beta import Assistant
from openai.types.beta.assistant_create_params import AssistantCreateParams
from openai.types.beta.function_tool_param import FunctionToolParam
from openai.types.shared_params import FunctionDefinition
from teams import Application, ApplicationOptions, TeamsAdapter
from teams.ai import AIOptions
from teams.ai.actions import ActionTurnContext
from teams.ai.planners import (
    AssistantsPlanner,
    AzureOpenAIAssistantsOptions,
    OpenAIAssistantsOptions,
)

from config import Config
from food_order_card import generate_card_for_order
from food_order_view_schema import Order
from state import AppTurnState

config = Config()

if config.OPENAI_KEY is None and config.AZURE_OPENAI_KEY is None:
    raise RuntimeError(
        "Missing environment variables - please check that OPENAI_KEY or AZURE_OPENAI_KEY is set."
    )

planner: AssistantsPlanner

# Create Assistant Planner
if config.AZURE_OPENAI_KEY and config.AZURE_OPENAI_ENDPOINT:
    planner = AssistantsPlanner[AppTurnState](
        AzureOpenAIAssistantsOptions(
            api_key=config.AZURE_OPENAI_KEY,
            api_version="2024-02-15-preview",
            endpoint=config.AZURE_OPENAI_ENDPOINT,
            default_model="gpt-4",
            assistant_id=config.ASSISTANT_ID,
        )
    )
else:
    planner = AssistantsPlanner[AppTurnState](
        OpenAIAssistantsOptions(api_key=config.OPENAI_KEY, assistant_id=config.ASSISTANT_ID)
    )

# Define storage and application
storage = MemoryStorage()
app = Application[AppTurnState](
    ApplicationOptions(
        bot_app_id=config.APP_ID,
        storage=storage,
        adapter=TeamsAdapter(config),
        ai=AIOptions(planner=planner),
    )
)


@app.before_turn
async def setup_assistant(context: TurnContext, state: AppTurnState):
    # Create an assistant if no ID is provided, this will require you to restart the
    # program and fill in the process.env.ASSISTANT_ID afterwards.
    if config.ASSISTANT_ID == "":
        try:
            with open(
                f"{os.getcwd()}/src/food_order_view_schema.json", "r", encoding="utf-8"
            ) as file:
                tools = json.load(file)
            params = AssistantCreateParams(
                name="Order Bot",
                instructions="/n".join(
                    [
                        "You are a food ordering bot for a restaurant named The Pub,"
                        "The customer can order pizza, beer, or salad.",
                        "If the customer doesn't specify the type of pizza, beer, or salad they want ask them.",
                        "Verify the order is complete and accurate before placing it with the place_order function.",
                    ]
                ),
                tools=[
                    FunctionToolParam(
                        type="function",
                        function=FunctionDefinition(
                            name="place_order",
                            description="Creates or updates a food order",
                            parameters=tools,
                        ),
                    )
                ],
                model="gpt-4",
            )

            assistant: Assistant

            if config.AZURE_OPENAI_KEY and config.AZURE_OPENAI_ENDPOINT:
                assistant = await AssistantsPlanner.create_assistant(
                    api_key=config.AZURE_OPENAI_KEY,
                    api_version="",
                    organization="",
                    endpoint=config.AZURE_OPENAI_ENDPOINT,
                    request=params,
                )
            else:
                assistant = await AssistantsPlanner.create_assistant(
                    api_key=config.OPENAI_KEY,
                    api_version="",
                    organization="",
                    endpoint="",
                    request=params,
                )
            print(f"Create a new assistant with an id of:{assistant.id}")
            sys.exit()
        except Exception as e:
            await context.send_activity(
                "The bot encountered an error or bug while setting up the assistant."
            )
    return True


@app.turn_state_factory
async def turn_state_factory(context: TurnContext):
    return await AppTurnState.load(context, storage)


@app.ai.action("place_order")
async def on_place_order(
    context: ActionTurnContext[Order],
    state: AppTurnState,
):
    card = generate_card_for_order(context.data)
    await context.send_activity(MessageFactory.attachment(card))
    return "order placed"


@app.error
async def on_error(context: TurnContext, error: Exception):
    # This check writes out errors to console log .vs. app insights.
    # NOTE: In production environment, you should consider logging this to Azure
    #       application insights.
    print(f"\n [on_turn_error] unhandled error: {error}", file=sys.stderr)
    traceback.print_exc()

    # Send a message to the user
    await context.send_activity("The bot encountered an error or bug.")
