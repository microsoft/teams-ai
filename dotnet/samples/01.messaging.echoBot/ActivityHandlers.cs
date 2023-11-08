using EchoBot.Model;
using Microsoft.Bot.Builder;
using Microsoft.Teams.AI;

namespace EchoBot
{
    /// <summary>
    /// Defines the activity handlers.
    /// </summary>
    public static class ActivityHandlers
    {
        /// <summary>
        /// Handles "/reset" message.
        /// </summary>
        public static RouteHandler<AppState> ResetMessageHandler = async (ITurnContext turnContext, AppState turnState, CancellationToken cancellationToken) =>
        {
            turnState.ConversationStateEntry.Delete();
            await turnContext.SendActivityAsync("Ok I've deleted the current conversation state", cancellationToken: cancellationToken);
        };

        /// <summary>
        /// Handles messages except "/reset".
        /// </summary>
        public static RouteHandler<AppState> MessageHandler = async (ITurnContext turnContext, AppState turnState, CancellationToken cancellationToken) =>
        {
            int count = turnState.Conversation.MessageCount;

            // Increment count state.
            turnState.Conversation.MessageCount = ++count;

            await turnContext.SendActivityAsync($"[{count}] you said: {turnContext.Activity.Text}", cancellationToken: cancellationToken);
        };
    }
}
