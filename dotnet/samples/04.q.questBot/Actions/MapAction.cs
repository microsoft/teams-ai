using Microsoft.Bot.Builder;
using Microsoft.TeamsAI.AI.Action;
using QuestBot.State;

namespace QuestBot.Actions
{
    public partial class QuestBotActions
    {
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
                    var newResponse = await _application.AI.CompletePromptAsync(turnContext, turnState, "UseMap", null, default);
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
    }
}
