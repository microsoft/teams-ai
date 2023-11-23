using LightBot.Model;
using Microsoft.Teams.AI;

namespace LightBot
{
    /// <summary>
    /// A bot that echo back the user's message.
    /// </summary>
    public class TeamsLightBot : Application<AppState>
    {
        public TeamsLightBot(ApplicationOptions<AppState> options) : base(options)
        {
            // Registering action handlers that will be hooked up to the planner.
            AI.ImportActions(new LightBotActions());
        }
    }
}
