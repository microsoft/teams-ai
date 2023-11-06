using Microsoft.Bot.Builder;
using Microsoft.Teams.AI;
using Microsoft.Teams.AI.AI;
using Microsoft.Teams.AI.AI.Action;
using Microsoft.Teams.AI.AI.Planner;
using QuestBot.Models;
using QuestBot.State;
using System.Text.Json;

namespace QuestBot.Actions
{
    public partial class QuestBotActions
    {
        private readonly Application<QuestState, QuestStateManager> _application;

        public QuestBotActions(Application<QuestState, QuestStateManager> application)
        {
            _application = application;
        }

        [Action(AIConstants.UnknownActionName)]
        public async Task<bool> UnknownAsync([ActionTurnContext] ITurnContext turnContext, [ActionName] string action)
        {
            await turnContext.SendActivityAsync($"<strong>{action}</strong> action missing");
            return true;
        }

        private static DataEntities GetData(Dictionary<string, object> entities)
        {
            ArgumentNullException.ThrowIfNull(entities);
            DataEntities data = JsonSerializer.Deserialize<DataEntities>(JsonSerializer.Serialize(entities))
                ?? throw new ArgumentException("Action data is not data entities.");
            return data;
        }

        /// <summary>
        /// Trims the prompt response by removing common junk that gets returned by the model.
        /// </summary>
        private static string TrimPromptResponse(string response)
        {
            // Remove common junk that gets returned by the model.
            return response.Replace("DM: ", string.Empty).Replace("```", string.Empty);
        }

        /// <summary>
        /// Updates the conversation history with the new response and sends the response to the user.
        /// </summary>
        private static async Task UpdateDMResponseAsync(ITurnContext context, QuestState state, string newResponse)
        {
            if (ConversationHistory.GetLastLine(state).StartsWith("DM:"))
            {
                ConversationHistory.ReplaceLastLine(state, $"DM: {newResponse}");
            }
            else
            {
                ConversationHistory.AddLine(state, $"DM: {newResponse}");
            }

            await context.SendActivityAsync(newResponse);
        }
    }
}
