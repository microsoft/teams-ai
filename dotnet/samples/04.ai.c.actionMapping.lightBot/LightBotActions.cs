using LightBot.Model;
using Microsoft.Bot.Builder;
using Microsoft.TeamsAI.AI.Action;

namespace LightBot
{
    public class LightBotActions
    {
        [Action("LightsOn")]
        public async Task<bool> LightsOn([ActionTurnContext] ITurnContext turnContext, [ActionTurnState] AppState turnState)
        {
            turnState.Conversation!.LightsOn = true;
            await turnContext.SendActivityAsync(MessageFactory.Text("[lights on]"));
            return true;
        }

        [Action("LightsOff")]
        public async Task<bool> LightsOff([ActionTurnContext] ITurnContext turnContext, [ActionTurnState] AppState turnState)
        {
            turnState.Conversation!.LightsOn = false;
            await turnContext.SendActivityAsync(MessageFactory.Text("[lights off]"));
            return true;
        }

        [Action("Pause")]
        public async Task<bool> LightsOff([ActionTurnContext] ITurnContext turnContext, [ActionEntities] Dictionary<string, object> entities)
        {
            // Try to parse entities returned by the model.
            // Expecting "time" to be a number of milliseconds to pause.
            if (entities.TryGetValue("time", out object time))
            {
                if (time is string timeString)
                {
                    if (int.TryParse(timeString, out int timeInt))
                    {
                        await turnContext.SendActivityAsync(MessageFactory.Text($"[pausing for {timeInt/1000} seconds]"));
                        await Task.Delay(timeInt);
                    }
                }
            }

            return true;
        }

        [Action("LightStatus")]
        public async Task<bool> LightStatus([ActionTurnContext] ITurnContext turnContext, [ActionTurnState] AppState turnState)
        {
            await turnContext.SendActivityAsync(ResponseGenerator.LightStatus(turnState.Conversation!.LightsOn));
            return false;
        }

        [Action(DefaultActionTypes.UnknownActionName)]
        public async Task<bool> UnknownAction([ActionTurnContext] TurnContext turnContext, [ActionName] string action)
        {
            await turnContext.SendActivityAsync(ResponseGenerator.UnknownAction(action ?? "Unknown"));
            return false;
        }
    }
}
