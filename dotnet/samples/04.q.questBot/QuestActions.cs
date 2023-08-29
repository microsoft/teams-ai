using Microsoft.Bot.Builder;
using Microsoft.TeamsAI;
using Microsoft.TeamsAI.AI.Action;
using Microsoft.TeamsAI.AI.Planner;
using QuestBot.Models;
using QuestBot.State;
using System.Text.Json;

namespace QuestBot
{
    public class QuestActions
    {
        private readonly Application<QuestState, QuestStateManager> _application;

        public QuestActions(Application<QuestState, QuestStateManager> application)
        {
            _application = application;
        }

        [Action("map")]
        public async Task<bool> MapAsync([ActionTurnContext] ITurnContext turnContext, [ActionTurnState] QuestState turnState, [ActionEntities] Dictionary<string, object> entities)
        {
            ArgumentNullException.ThrowIfNull(turnContext);
            ArgumentNullException.ThrowIfNull(turnState);
            var data = GetData(entities);
            var action = (data.Operation ?? string.Empty).Trim().ToLowerInvariant();
            switch (action)
            {
                case "query":
                    // Use the map to answer player
                    var newResponse = await _application.AI.CompletePromptAsync(turnContext, turnState, "useMap", null, default);
                    if (!string.IsNullOrEmpty(newResponse))
                    {
                        await UpdateDMResponseAsync(turnContext, turnState, string.Join("<br>", TrimPromptResponse(newResponse).Split('\n')));
                        turnState.Temp!.PlayerAnswered = true;
                    }
                    else
                    {
                        await UpdateDMResponseAsync(turnContext, turnState, ResponseGenerator.DataError());
                    }
                    return false;
                default:
                    await turnContext.SendActivityAsync($"[map.{action}]");
                    return true;
            }
        }

        [Action("story")]
        public async Task<bool> StoryAsync([ActionTurnContext] ITurnContext turnContext, [ActionTurnState] QuestState turnState, [ActionEntities] Dictionary<string, object> entities)
        {
            ArgumentNullException.ThrowIfNull(turnContext);
            ArgumentNullException.ThrowIfNull(turnState);
            var data = GetData(entities);
            var action = (data.Operation ?? string.Empty).Trim().ToLowerInvariant();
            switch (action)
            {
                case "change":
                case "update":
                    var description = (data.Description ?? string.Empty).Trim();
                    if (description.Length > 0)
                    {
                        // Write story change to conversation state
                        turnState.Conversation!.Story = description;
                    }
                    return true;
                default:
                    await turnContext.SendActivityAsync($"[story.{action}]");
                    return true;
            }
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
