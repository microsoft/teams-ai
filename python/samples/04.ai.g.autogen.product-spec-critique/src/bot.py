"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.

Description: initialize the app and listen for `message` activitys
"""

import sys
import traceback
from botbuilder.schema import Activity, ActivityTypes

from botbuilder.core import TurnContext, MemoryStorage
from teams import Application, ApplicationOptions, TeamsAdapter
from teams.ai import AIOptions
from teams.ai.actions import ActionTypes, ActionTurnContext
from autogen_planner import AutoGenPlanner, PredictedSayCommandWithAttachments

from config import Config
from state import AppTurnState

from spec_critique_group import SpecCritiqueGroup

config = Config()

llm_config = config.build_llm_config()
if llm_config is None:
    raise RuntimeError(
        "Unable to build LLM config - please check that OPENAI_KEY or AZURE_OPENAI_KEY is set."
    )
spec_critique_group = SpecCritiqueGroup(llm_config=llm_config)

storage = MemoryStorage()
app = Application[AppTurnState](
    ApplicationOptions(
        bot_app_id=config.APP_ID,
        storage=storage,
        adapter=TeamsAdapter(config),
        ai=AIOptions(planner=AutoGenPlanner(llm_config=llm_config, build_group_chat=spec_critique_group.build_group_chat)),
    ),
)

@app.ai.action(ActionTypes.SAY_COMMAND)
async def say_command(context: ActionTurnContext[PredictedSayCommandWithAttachments], _state: AppTurnState):
    content = (
        context.data.response.content
        if context.data.response and context.data.response.content
        else ""
    )
    
    if content:
        await context.send_activity(
            Activity(
                type=ActivityTypes.message,
                text=content,
                attachments=context.data.response.attachments,
                entities=[
                    {
                        "type": "https://schema.org/Message",
                        "@type": "Message",
                        "@context": "https://schema.org",
                        "@id": "",
                        "additionalType": ["AIGeneratedContent"],
                    }
                ],
            )
        )

    return ""

@app.message("/clear")
async def clear(context: TurnContext, state: AppTurnState):
    await state.conversation.clear(context)
    await context.send_activity("Cleared and ready to analyze next spec")
    
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
