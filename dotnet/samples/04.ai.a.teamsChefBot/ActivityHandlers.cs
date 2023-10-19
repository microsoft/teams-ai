using Microsoft.Bot.Builder;
using Microsoft.TeamsAI;
using Microsoft.TeamsAI.AI.Planner;
using Microsoft.TeamsAI.State;

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
