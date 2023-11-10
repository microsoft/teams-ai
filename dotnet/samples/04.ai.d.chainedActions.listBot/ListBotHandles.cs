using ListBot.Model;
using Microsoft.Bot.Builder;

namespace ListBot
{
    public class ListBotHandlers
    {
        public static async Task OnMembersAddedAsync(ITurnContext turnContext, ListState turnState, CancellationToken cancellationToken)
        {
            ArgumentNullException.ThrowIfNull(turnContext);
            ArgumentNullException.ThrowIfNull(turnState);

            if (!turnState.Conversation!.Greeted)
            {
                turnState.Conversation.Greeted = true;
                await turnContext.SendActivityAsync(MessageFactory.Text(ResponseBuilder.Greeting()), cancellationToken).ConfigureAwait(false);
            }
        }

        public static async Task OnResetMessageAsync(ITurnContext turnContext, ListState turnState, CancellationToken cancellationToken)
        {
            ArgumentNullException.ThrowIfNull(turnContext);
            ArgumentNullException.ThrowIfNull(turnState);

            turnState.ConversationStateEntry?.Delete();
            await turnContext.SendActivityAsync(MessageFactory.Text(ResponseBuilder.Reset()), cancellationToken).ConfigureAwait(false);
        }
    }
}
