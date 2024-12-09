using LightBot.Model;
using Microsoft.Bot.Builder;
using Microsoft.Teams.AI.AI.Action;
using Microsoft.Teams.AI.AI;
using System.Diagnostics;
using System.Threading;
using Microsoft.Teams.AI.State;

namespace LightBot
{
    public class LightBotActions
    {
        [Action("LightsOn")]
        public async Task<string> LightsOn([ActionTurnContext] ITurnContext turnContext, [ActionTurnState] AppState turnState)
        {
            turnState.Conversation.LightsOn = true;
            Trace.WriteLine("[The lights are on]");
            return "the lights are now on";
        }

        [Action("LightsOff")]
        public async Task<string> LightsOff([ActionTurnContext] ITurnContext turnContext, [ActionTurnState] AppState turnState)
        {
            turnState.Conversation.LightsOn = false;
            Trace.WriteLine("[The lights are off]");
            return "the lights are now off";
        }

        [Action("Pause")]
        public async Task<string> LightsOff([ActionTurnContext] ITurnContext turnContext, [ActionParameters] Dictionary<string, object> args)
        {
            // Try to parse entities returned by the model.
            // Expecting "time" to be a number of milliseconds to pause.
            if (args.TryGetValue("time", out object? time))
            {
                if (time != null && time is long timeLong)
                {
                    int timeInt = (int)timeLong;
                    Trace.WriteLine($"[pausing for {timeInt / 1000} seconds]");
                    await Task.Delay(timeInt);
                }
            }

            return "done pausing";
        }

        [Action("LightStatus")]
        public async Task<string> LightStatus([ActionTurnContext] ITurnContext turnContext, [ActionTurnState] AppState turnState)
        {
            Trace.WriteLine(ResponseGenerator.LightStatus(turnState.Conversation.LightsOn));
            return turnState.Conversation.LightsOn ? "the lights are on" : "the lights are off";
        }

        [Action(AIConstants.UnknownActionName)]
        public async Task<string> UnknownAction([ActionTurnContext] TurnContext turnContext, [ActionName] string action)
        {
            Trace.WriteLine(ResponseGenerator.UnknownAction(action ?? "Unknown"));
            return "unknown action";
        }
    }
}
