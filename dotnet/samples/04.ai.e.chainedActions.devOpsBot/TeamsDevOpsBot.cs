using DevOpsBot.Model;
using Microsoft.Bot.Builder;
using Microsoft.Bot.Schema;
using Microsoft.Teams.AI;
using Newtonsoft.Json;

namespace DevOpsBot
{
    public class TeamsDevOpsBot : Application<DevOpsState, DevOpsStateManager>
    {
        public TeamsDevOpsBot(ApplicationOptions<DevOpsState, DevOpsStateManager> options) : base(options)
        {
            // Adds function to be referenced in the prompt template
            AI.Prompts.AddFunction("getWorkItems", (turnContext, turnState) =>
            {
                EntityData[] workItems = turnState.Conversation!.WorkItems;
                string workItemsContent = JsonConvert.SerializeObject(workItems);
                return Task.FromResult(workItemsContent);
            });

            // Registering action handlers that will be hooked up to the planner.
            AI.ImportActions(new DevOpsActions(this));
        }

        protected override async Task OnMembersAddedAsync(IList<ChannelAccount> membersAdded, ITurnContext<IConversationUpdateActivity> turnContext, DevOpsState turnState, CancellationToken cancellationToken)
        {
            ArgumentNullException.ThrowIfNull(turnContext);
            ArgumentNullException.ThrowIfNull(turnState);

            if (!turnState.Conversation!.Greeted)
            {
                await turnContext.SendActivityAsync(ResponseBuilder.Greeting(), cancellationToken: cancellationToken).ConfigureAwait(false);
                turnState.Conversation.Greeted = true;
            }
        }

        protected override async Task OnMessageActivityAsync(ITurnContext<IMessageActivity> turnContext, DevOpsState turnState, CancellationToken cancellationToken)
        {
            ArgumentNullException.ThrowIfNull(turnContext);
            ArgumentNullException.ThrowIfNull(turnState);

            string? input = turnContext.Activity.Text?.Trim();
            if (string.Equals("/reset", input, StringComparison.OrdinalIgnoreCase))
            {
                turnState.ConversationStateEntry?.Delete();
                await turnContext.SendActivityAsync(ResponseBuilder.Reset(), cancellationToken: cancellationToken).ConfigureAwait(false);
            }
            else
            {
                // call base message handler to go the AI flow
                await base.OnMessageActivityAsync(turnContext, turnState, cancellationToken).ConfigureAwait(false);
            }

        }
    }
}
