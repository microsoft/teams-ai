using Microsoft.Bot.Builder;
using Microsoft.TeamsAI.AI.Action;
using QuestBot.Models;
using QuestBot.State;

namespace QuestBot.Actions
{
    public partial class QuestBotActions
    {
        [Action("quest")]
        public async Task<bool> QuestAsync([ActionTurnContext] ITurnContext turnContext, [ActionTurnState] QuestState turnState, [ActionEntities] Dictionary<string, object> entities)
        {
            ArgumentNullException.ThrowIfNull(turnContext);
            ArgumentNullException.ThrowIfNull(turnState);
            var data = GetData(entities);
            var action = (data.Operation ?? string.Empty).Trim().ToLowerInvariant();
            switch (action)
            {
                case "add":
                case "update":
                    await UpdateQuestAsync(turnContext, turnState, data);
                    break;
                case "remove":
                    RemoveQuestAsync(turnState, data);
                    break; ;
                case "finish":
                    FinishQuestAsync(turnState, data);
                    break; ;
                case "list":
                    await ListQuestAsync(turnContext, turnState);
                    break;
                default:
                    await turnContext.SendActivityAsync($"[quest.{action}]");
                    break;
            }

            return true;
        }

        private async Task UpdateQuestAsync(ITurnContext context, QuestState state, DataEntities data)
        {
            var quests =
                state.Conversation!.Quests == null ?
                new Dictionary<string, Quest>(StringComparer.OrdinalIgnoreCase) :
                new Dictionary<string, Quest>(state.Conversation!.Quests, StringComparer.OrdinalIgnoreCase);

            // Create new quest
            var title = (data.Title ?? string.Empty).Trim();
            var quest = new Quest
            {
                Title = title,
                Description = (data.Description ?? string.Empty).Trim(),
            };

            // Expand quest details
            var details = await _application.AI.CompletePromptAsync(context, state, "QuestDetails", null, default);
            if (!string.IsNullOrEmpty(details))
            {
                quest.Description = details.Trim();
            }

            // Add quest to collection of active quests
            quests[title] = quest;

            // Save updated location to conversation
            state.Conversation.Quests = quests;

            // Tell use they have a new/updated quest
            await context.SendActivityAsync(quest.ToMessage());
            state.Temp!.PlayerAnswered = true;
        }

        private static bool RemoveQuestAsync(QuestState state, DataEntities data)
        {
            var quests =
                state.Conversation!.Quests == null ?
                new Dictionary<string, Quest>(StringComparer.OrdinalIgnoreCase) :
                new Dictionary<string, Quest>(state.Conversation!.Quests, StringComparer.OrdinalIgnoreCase);

            // Find quest and delete it
            var title = (data.Title ?? string.Empty).Trim();
            if (quests.Remove(title))
            {
                state.Conversation!.Quests = quests;
                return true;
            }

            return false;
        }

        private static void FinishQuestAsync(QuestState state, DataEntities data)
        {
            if (RemoveQuestAsync(state, data))
            {
                // Check for the completion of a campaign objective
                var campaign = state.Conversation!.Campaign;
                if (campaign != null && campaign.Objectives.Count > 0)
                {
                    var title = (data.Title ?? string.Empty).Trim();
                    foreach (var objective in campaign.Objectives)
                    {
                        if (string.Equals(objective.Title, title, StringComparison.OrdinalIgnoreCase))
                        {
                            objective.Completed = true;
                            break;
                        }
                    }

                    state.Conversation!.Campaign = campaign;
                }
            }
        }

        private static async Task ListQuestAsync(ITurnContext context, QuestState state)
        {
            if (state.Conversation!.Quests != null)
            {
                string message = string.Join("<br>", state.Conversation!.Quests.Values.Select(q => q.ToMessage()));

                // Show player list of quests
                if (message.Length > 0)
                {
                    await context.SendActivityAsync(message);
                }
            }

            state.Temp!.PlayerAnswered = true;
        }
    }
}
