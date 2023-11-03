using ListBot.Model;
using Microsoft.Bot.Builder;
using Microsoft.Bot.Schema;
using Microsoft.Teams.AI;
using System.Text.Json;

namespace ListBot
{
    public class ListBotApplication : Application<ListState, ListStateManager>
    {
        public ListBotApplication(ApplicationOptions<ListState, ListStateManager> options) : base(options)
        {
            AI.Prompts.AddFunction("getListNames", (turnContext, turnState) =>
            {
                string listNames = JsonSerializer.Serialize(turnState.Conversation!.ListNames);
                return Task.FromResult(listNames);
            });

            AI.Prompts.AddFunction("getLists", (turnContext, turnState) =>
            {
                string lists = JsonSerializer.Serialize(turnState.Conversation!.Lists);
                return Task.FromResult(lists);
            });

            AI.ImportActions(new ListBotActions(this));
        }

        protected override async Task OnMembersAddedAsync(IList<ChannelAccount> membersAdded, ITurnContext<IConversationUpdateActivity> turnContext, ListState turnState, CancellationToken cancellationToken)
        {
            ArgumentNullException.ThrowIfNull(turnContext);
            ArgumentNullException.ThrowIfNull(turnState);

            if (!turnState.Conversation!.Greeted)
            {
                turnState.Conversation.Greeted = true;
                await turnContext.SendActivityAsync(MessageFactory.Text(ResponseBuilder.Greeting()), cancellationToken).ConfigureAwait(false);
            }
        }

        protected override async Task OnMessageActivityAsync(ITurnContext<IMessageActivity> turnContext, ListState turnState, CancellationToken cancellationToken)
        {
            ArgumentNullException.ThrowIfNull(turnContext);
            ArgumentNullException.ThrowIfNull(turnState);

            if (turnContext.Activity.Text.Equals("/reset", StringComparison.OrdinalIgnoreCase))
            {
                turnState.ConversationStateEntry?.Delete();
                await turnContext.SendActivityAsync(MessageFactory.Text(ResponseBuilder.Reset()), cancellationToken).ConfigureAwait(false);
            }
            else
            {
                await base.OnMessageActivityAsync(turnContext, turnState, cancellationToken).ConfigureAwait(false);
            }
        }
    }
}
