using Microsoft.Bot.Builder;
using Microsoft.TeamsAI;
using Microsoft.TeamsAI.AI.Action;
using Microsoft.TeamsAI.AI.Planner;
using Microsoft.TeamsAI.State;
using Microsoft.Bot.Schema;
using System.Text.Json;

namespace TeamsChefBot
{
    public class TeamsChefBotApplication : Application<TurnState, TurnStateManager>
    {
        public TeamsChefBotApplication(ApplicationOptions<TurnState, TurnStateManager> options) : base(options) 
        {
            AI.ImportActions(new TeamsChefBotActions());
        }

        protected override async Task OnMessageActivityAsync(ITurnContext<IMessageActivity> turnContext, TurnState turnState, CancellationToken cancellationToken)
        {
            if (turnContext.Activity.Type == ActivityTypes.Message)
            {
                if (turnContext.Activity.Text == "/history")
                {
                    string history = ConversationHistory.ToString(turnState, 2000, "\n\n");
                    await turnContext.SendActivityAsync(history);
                    return;
                }
            }
            throw new NotImplementedException();
        }
    }

    internal class TeamsChefBotActions
    {
        [Action(DefaultActionTypes.FlaggedInputActionName)]
        public async Task<bool> FlaggedInputAction([ActionTurnContext] TurnContext turnContext, [ActionEntities] Dictionary<string, object> entities)
        {
            string entitiesJsonString = JsonSerializer.Serialize(entities);
            await turnContext.SendActivityAsync($"I'm sorry your message was flagged: {entitiesJsonString}");
            return false;
        }

        [Action(DefaultActionTypes.FlaggedOutputActionName)]
        public async Task<bool> FlaggedOutputAction([ActionTurnContext] TurnContext turnContext)
        {
            await turnContext.SendActivityAsync("I'm not allowed to talk about such things.");
            return false;
        }
    }
}
