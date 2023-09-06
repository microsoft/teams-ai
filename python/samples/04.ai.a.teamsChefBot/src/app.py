"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""


import uvicorn
from botbuilder.core import BotFrameworkAdapterSettings, MemoryStorage, TurnContext
from botbuilder.schema import Activity
from fastapi import FastAPI, Request, Response
from teams import (
    AIHistoryOptions,
    AIOptions,
    Application,
    ApplicationOptions,
    AzureOpenAIPlanner,
    AzureOpenAIPlannerOptions,
    TurnState,
)

from src.config import Config

# Initialize Teams AI application
planner = AzureOpenAIPlanner(
    AzureOpenAIPlannerOptions(
        Config.AZURE_OPENAI_KEY,
        Config.AZURE_OPENAI_MODEL_DEPLOYMENT_NAME,
        Config.AZURE_OPENAI_ENDPOINT,
    )
)
storage = MemoryStorage()
app = Application[TurnState](
    ApplicationOptions(
        auth=BotFrameworkAdapterSettings(
            app_id=Config.BOT_ID,
            app_password=Config.BOT_PASSWORD,
        ),
        ai=AIOptions(
            planner=planner,
            prompt="chat",
            history=AIHistoryOptions(assistant_history_type="text"),
        ),
        storage=storage,
    )
)


@app.message("/history")
async def handle_history_command(context: TurnContext, state: TurnState) -> bool:
    history = state.conversation.history.to_str(2000, "cl100k_base", "\n\n")
    await context.send_activity(history)
    return True


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
