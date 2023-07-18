using EchoBot.Model;
using Microsoft.Bot.Builder;
using Microsoft.Bot.Schema;
using Microsoft.TeamsAI;

namespace EchoBot
{
    /// <summary>
    /// A bot that echo back the user's message.
    /// </summary>
    public class TeamsEchoBot : Application<AppState, AppStateManager>
    {
        public TeamsEchoBot(ApplicationOptions<AppState, AppStateManager> options) : base(options)
        {
        }

        // Handle incoming activities by overriding the corresponding activity handler method.
        protected override async Task OnMessageActivityAsync(ITurnContext<IMessageActivity> turnContext, AppState turnState, CancellationToken cancellationToken)
        {
            string text = turnContext.Activity.Text.Trim();

            // Listen for user to say '/reset' and then delete conversation state
            if (text.Equals("/reset", StringComparison.OrdinalIgnoreCase))
            {
                turnState.ConversationStateEntry.Delete();
                await turnContext.SendActivityAsync("Ok I've deleted the current conversation state");
            } else
            {
                int count = turnState.Conversation.MessageCount;

                // Increment count state.
                turnState.Conversation.MessageCount = ++count;

                await turnContext.SendActivityAsync($"[{count}] you said: {turnContext.Activity.Text}");
            }
        }

    }
}
