using LightBot.Model;
using Microsoft.Teams.AI;

namespace LightBot
{
    /// <summary>
    /// A bot that echo back the user's message.
    /// </summary>
    public class TeamsLightBot : Application<AppState, AppStateManager>
    {
        public TeamsLightBot(ApplicationOptions<AppState, AppStateManager> options) : base(options)
        {
            // Adds function to be referenced in the prompt template
            AI.Prompts.AddFunction("getLightStatus", (turnContext, turnState) =>
            {
                return Task.FromResult(turnState.Conversation!.LightsOn ? "on" : "off");
            });

            // Registering action handlers that will be hooked up to the planner.
            AI.ImportActions(new LightBotActions());
        }
    }
}
