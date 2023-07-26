using ListBot.Model;
using Microsoft.Bot.Builder;
using Microsoft.Bot.Schema;
using Microsoft.TeamsAI;
using Newtonsoft.Json;

namespace ListBot
{
    public class ListBotApplication : Application<ListState, ListStateManager>
    {
        public ListBotApplication(ApplicationOptions<ListState, ListStateManager> options) : base(options)
        {
            AI.Prompts.AddFunction("getListNames", (turnContext, turnState) =>
            {
                string listNames = JsonConvert.SerializeObject(turnState.Conversation!.ListNames);
                return Task.FromResult(listNames);
            });

            AI.Prompts.AddFunction("getLists", (turnContext, turnState) =>
            {
                string lists = JsonConvert.SerializeObject(turnState.Conversation!.Lists);
                return Task.FromResult(lists);
            });

            AI.ImportActions(new ListBotActions(this));
        }

        protected override async Task OnMembersAddedAsync(IList<ChannelAccount> membersAdded, ITurnContext<IConversationUpdateActivity> turnContext, ListState turnState, CancellationToken cancellationToken)
        {
            if (turnContext == null)
            {
                throw new ArgumentNullException(nameof(turnContext));
            }

            if (turnState == null)
            {
                throw new ArgumentNullException(nameof(turnState));
            }

            bool greeted = turnState.Conversation!.Greeted;
            if (!greeted)
            {
                turnState.Conversation.Greeted = true;
                await turnContext.SendActivityAsync(MessageFactory.Text(ResponseBuilder.Greeting()), cancellationToken).ConfigureAwait(false);
            }
        }

        protected override async Task OnMessageActivityAsync(ITurnContext<IMessageActivity> turnContext, ListState turnState, CancellationToken cancellationToken)
        {
            if (turnContext == null)
            {
                throw new ArgumentNullException(nameof(turnContext));
            }

            if (turnState == null)
            {
                throw new ArgumentNullException(nameof(turnState));
            }

            if (turnContext.Activity.Text.Equals("/reset", StringComparison.OrdinalIgnoreCase))
            {
                turnState.ConversationStateEntry?.Delete();
                await turnContext.SendActivityAsync(MessageFactory.Text(ResponseBuilder.Reset()), cancellationToken).ConfigureAwait(false);
                return;
            }
            else
            {
                await base.OnMessageActivityAsync(turnContext, turnState, cancellationToken).ConfigureAwait(false);
            }
        }
    }
}
