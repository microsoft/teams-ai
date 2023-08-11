from teams import Application, ApplicationOptions, TurnState
from botbuilder.core import (
    BotFrameworkAdapterSettings,
    TurnContext,
    BotFrameworkAdapter,
)

from config import Config

config = Config()
settings = BotFrameworkAdapterSettings(config.app_id, config.app_password)
adapter = BotFrameworkAdapter(settings)
app = Application(ApplicationOptions(adapter))

@app.activity("message")
async def on_message(context: TurnContext, _state: TurnState):
    await context.send_activity(f"you said: {context.activity.text}")
    return True
