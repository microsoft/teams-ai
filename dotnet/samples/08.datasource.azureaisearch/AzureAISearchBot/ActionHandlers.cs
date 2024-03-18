using Microsoft.Bot.Builder;
using Microsoft.Teams.AI.AI.Action;
using Microsoft.Teams.AI.AI;
using System.Text.Json;

namespace AzureAISearchBot
{
    public class ActionHandlers
    {
        [Action(AIConstants.FlaggedInputActionName)]
        public async Task<string> OnFlaggedInput([ActionTurnContext] ITurnContext turnContext, [ActionParameters] Dictionary<string, object> entities)
        {
            string entitiesJsonString = JsonSerializer.Serialize(entities);
            await turnContext.SendActivityAsync($"I'm sorry your message was flagged: {entitiesJsonString}");
            return "";
        }

        [Action(AIConstants.FlaggedOutputActionName)]
        public async Task<string> OnFlaggedOutput([ActionTurnContext] ITurnContext turnContext)
        {
            await turnContext.SendActivityAsync("I'm not allowed to talk about such things.");
            return "";
        }
    }
}
