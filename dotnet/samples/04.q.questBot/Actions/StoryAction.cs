using Microsoft.Bot.Builder;
using Microsoft.TeamsAI.AI.Action;
using QuestBot.State;

namespace QuestBot.Actions
{
    public partial class QuestBotActions
    {
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
    }
}
