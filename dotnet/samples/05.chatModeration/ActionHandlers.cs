using Microsoft.Bot.Builder;
using Microsoft.Teams.AI.AI.Action;
using Microsoft.Teams.AI.AI;
using System.Text.Json;

namespace ChatModeration
{
    public class ActionHandlers
    {
        private static JsonSerializerOptions _jsonSerializerOptions = new()
        {
            WriteIndented = true,
        };

        [Action(AIConstants.FlaggedInputActionName)]
        public async Task<string> OnFlaggedInput([ActionTurnContext] ITurnContext turnContext, [ActionParameters] Dictionary<string, object> entities)
        {
            string entitiesJsonString = JsonSerializer.Serialize(entities, _jsonSerializerOptions);
            await turnContext.SendActivityAsync($"I'm sorry your message was flagged:");
            await turnContext.SendActivityAsync($"```{entitiesJsonString}");
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
