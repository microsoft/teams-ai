using LightBot.Model;
using Microsoft.Bot.Builder;
using Microsoft.Teams.AI.AI.Action;
using Microsoft.Teams.AI.AI;

namespace LightBot
{
    public class LightBotActions
    {
        [Action("LightsOn")]
        public async Task<string> LightsOn([ActionTurnContext] ITurnContext turnContext, [ActionTurnState] AppState turnState)
        {
            turnState.Conversation.LightsOn = true;
            await turnContext.SendActivityAsync(MessageFactory.Text("[lights on]"));
            return "the lights are now on";
        }

        [Action("LightsOff")]
        public async Task<string> LightsOff([ActionTurnContext] ITurnContext turnContext, [ActionTurnState] AppState turnState)
        {
            turnState.Conversation.LightsOn = false;
            await turnContext.SendActivityAsync(MessageFactory.Text("[lights off]"));
            return "the lights are now off";
        }

        [Action("Pause")]
        public async Task<string> LightsOff([ActionTurnContext] ITurnContext turnContext, [ActionParameters] Dictionary<string, object> args)
        {
            // Try to parse entities returned by the model.
            // Expecting "time" to be a number of milliseconds to pause.
            if (args.TryGetValue("time", out object? time))
            {
                if (time != null && time is string timeString)
                {
                    if (int.TryParse(timeString, out int timeInt))
                    {
                        await turnContext.SendActivityAsync(MessageFactory.Text($"[pausing for {timeInt / 1000} seconds]"));
                        await Task.Delay(timeInt);
                    }
                }
            }

            return "done pausing";
        }

        [Action("LightStatus")]
        public async Task<string> LightStatus([ActionTurnContext] ITurnContext turnContext, [ActionTurnState] AppState turnState)
        {
            await turnContext.SendActivityAsync(ResponseGenerator.LightStatus(turnState.Conversation.LightsOn));
            return turnState.Conversation.LightsOn ? "the lights are on" : "the lights are off";
        }

        [Action(AIConstants.UnknownActionName)]
        public async Task<string> UnknownAction([ActionTurnContext] TurnContext turnContext, [ActionName] string action)
        {
            await turnContext.SendActivityAsync(ResponseGenerator.UnknownAction(action ?? "Unknown"));
            return "unknown action";
        }
    }
}
