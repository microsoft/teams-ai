using Microsoft.Bot.Builder;
using Microsoft.TeamsAI;
using Microsoft.TeamsAI.AI.Planner;
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

        private static DataEntities GetData(Dictionary<string, object> entities)
        {
            ArgumentNullException.ThrowIfNull(entities);
            DataEntities data = JsonSerializer.Deserialize<DataEntities>(JsonSerializer.Serialize(entities))
                ?? throw new ArgumentException("Action data is not work item.");
            return data;
        }

        private static string TrimPromptResponse(string response)
        {
            // Remove common junk that gets returned by the model.
            return response.Replace("DM: ", string.Empty).Replace("```", string.Empty);
        }

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
