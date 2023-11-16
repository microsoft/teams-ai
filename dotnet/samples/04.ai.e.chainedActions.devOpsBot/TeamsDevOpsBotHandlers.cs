using DevOpsBot.Model;
using Microsoft.Bot.Builder;

namespace DevOpsBot
{
    public class TeamsDevOpsBotHandlers
    {
        public static async Task OnMembersAddedAsync(ITurnContext turnContext, DevOpsState turnState, CancellationToken cancellationToken)
        {
            ArgumentNullException.ThrowIfNull(turnContext);
            ArgumentNullException.ThrowIfNull(turnState);

            if (!turnState.Conversation!.Greeted)
            {
                await turnContext.SendActivityAsync(ResponseBuilder.Greeting(), cancellationToken: cancellationToken).ConfigureAwait(false);
                turnState.Conversation.Greeted = true;
            }
        }

        public static async Task OnResetMessageAsync(ITurnContext turnContext, DevOpsState turnState, CancellationToken cancellationToken)
        {
            ArgumentNullException.ThrowIfNull(turnContext);
            ArgumentNullException.ThrowIfNull(turnState);

            turnState.ConversationStateEntry?.Delete();
            await turnContext.SendActivityAsync(ResponseBuilder.Reset(), cancellationToken: cancellationToken).ConfigureAwait(false);
        }
    }
}
