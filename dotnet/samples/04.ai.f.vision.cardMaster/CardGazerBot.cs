using CardGazer.Model;
using Microsoft.Teams.AI;

namespace CardGazer
{
    /// <summary>
    /// A bot that echo back the user's message.
    /// </summary>
    public class CardGazerBot : Application<AppState>
    {
        public CardGazerBot(ApplicationOptions<AppState> options) : base(options)
        {
            // Registering action handlers that will be hooked up to the planner.
            AI.ImportActions(new CardGazerBotActions());
        }
    }
}
