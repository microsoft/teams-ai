using Microsoft.Bot.Builder;
using Microsoft.TeamsAI.AI.Action;
using Microsoft.TeamsAI.AI;
using System.Text.Json;

namespace TeamsChefBot
{
    public class ActionHandlers
    {
        [Action(AIConstants.FlaggedInputActionName)]
        public async Task<bool> OnFlaggedInput([ActionTurnContext] ITurnContext turnContext, [ActionEntities] Dictionary<string, object> entities)
        {
            string entitiesJsonString = JsonSerializer.Serialize(entities);
            await turnContext.SendActivityAsync($"I'm sorry your message was flagged: {entitiesJsonString}");
            return false;
        }

        [Action(AIConstants.FlaggedOutputActionName)]
        public async Task<bool> OnFlaggedOutput([ActionTurnContext] ITurnContext turnContext)
        {
            await turnContext.SendActivityAsync("I'm not allowed to talk about such things.");
            return false;
        }
    }
}
