using Microsoft.Bot.Builder;
using Microsoft.Teams.AI;
using Microsoft.Teams.AI.AI.Planner;
using Microsoft.Teams.AI.State;

namespace TeamsChefBot
{
    /// <summary>
    /// Defines the activity handlers.
    /// </summary>
    public static class ActivityHandlers
    {
        /// <summary>
        /// Handles "/history" message.
        /// </summary>
        public static RouteHandler<TurnState> HistoryMessageHandler = async (ITurnContext turnContext, TurnState turnState, CancellationToken cancellationToken) =>
        {
            string history = ConversationHistory.ToString(turnState, 2000, "\n\n");
            await turnContext.SendActivityAsync(history);
        };
    }
}
