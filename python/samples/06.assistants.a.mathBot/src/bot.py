"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.

Description: initialize the app and listen for `message` activitys
"""

import sys
import traceback

from botbuilder.core import MemoryStorage, TurnContext
from openai.types.beta import Assistant
from openai.types.beta.assistant_create_params import AssistantCreateParams
from openai.types.beta.code_interpreter_tool_param import CodeInterpreterToolParam
from teams import Application, ApplicationOptions, TeamsAdapter
from teams.ai import AIOptions
from teams.ai.planners import (
    AssistantsPlanner,
    AzureOpenAIAssistantsOptions,
    OpenAIAssistantsOptions,
)

from config import Config
from state import AppTurnState
from azure.identity import get_bearer_token_provider, DefaultAzureCredential

config = Config()

if config.OPENAI_KEY is None and config.AZURE_OPENAI_ENDPOINT is None:
    raise RuntimeError(
        "Missing environment variables - please check that OPENAI_KEY or AZURE_OPENAI_ENDPOINT is set."
    )

planner: AssistantsPlanner

# Create Assistant Planner
if config.AZURE_OPENAI_ENDPOINT:
    if config.AZURE_OPENAI_KEY:
        planner = AssistantsPlanner[AppTurnState](
            AzureOpenAIAssistantsOptions(
                api_key=config.AZURE_OPENAI_KEY,
                api_version="2024-05-01-preview",
                endpoint=config.AZURE_OPENAI_ENDPOINT,
                default_model="gpt-4o",
                assistant_id=config.ASSISTANT_ID,
            )
        )
    else:
        # Managed Identity Auth
        planner = AssistantsPlanner[AppTurnState](
            AzureOpenAIAssistantsOptions(
                azure_ad_token_provider=get_bearer_token_provider(DefaultAzureCredential(), 'https://cognitiveservices.azure.com/.default'),
                api_version="2024-05-01-preview",
                endpoint=config.AZURE_OPENAI_ENDPOINT,
                default_model="gpt-4o",
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
        params = AssistantCreateParams(
            name="Math Tutor",
            instructions="You are a personal math tutor. Write and run code to answer math questions.",
            tools=[CodeInterpreterToolParam(type="code_interpreter")],
            model="gpt-4o",
        )

        assistant: Assistant

        if config.AZURE_OPENAI_ENDPOINT:
            if config.AZURE_OPENAI_KEY:
                assistant = await AssistantsPlanner.create_assistant(
                    api_key=config.AZURE_OPENAI_KEY,
                    azure_ad_token_provider=None,
                    api_version="2024-05-01-preview",
                    organization="",
                    endpoint=config.AZURE_OPENAI_ENDPOINT,
                    request=params,
                )
            else:
                assistant = await AssistantsPlanner.create_assistant(
                    api_key=None,
                    azure_ad_token_provider=get_bearer_token_provider(DefaultAzureCredential(), 'https://cognitiveservices.azure.com/.default'),
                    api_version="2024-05-01-preview",
                    organization="",
                    endpoint=config.AZURE_OPENAI_ENDPOINT,
                    request=params,
                )
        else:
            assistant = await AssistantsPlanner.create_assistant(
                api_key=config.OPENAI_KEY,
                azure_ad_token_provider=None,
                api_version="",
                organization="",
                endpoint="",
                request=params,
            )
        print(f"Create a new assistant with an id of:{assistant.id}")
        sys.exit()
    return True


@app.turn_state_factory
async def turn_state_factory(context: TurnContext):
    return await AppTurnState.load(context, storage)


@app.error
async def on_error(context: TurnContext, error: Exception):
    # This check writes out errors to console log .vs. app insights.
    # NOTE: In production environment, you should consider logging this to Azure
    #       application insights.
    print(f"\n [on_turn_error] unhandled error: {error}", file=sys.stderr)
    traceback.print_exc()

    # Send a message to the user
    await context.send_activity("The bot encountered an error or bug.")
