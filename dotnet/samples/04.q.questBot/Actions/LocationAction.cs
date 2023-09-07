using Microsoft.Bot.Builder;
using Microsoft.TeamsAI.AI.Action;
using QuestBot.Models;
using QuestBot.State;

namespace QuestBot.Actions
{
    public partial class QuestBotActions
    {
        [Action("location")]
        public async Task<bool> LocationAsync([ActionTurnContext] ITurnContext turnContext, [ActionTurnState] QuestState turnState, [ActionEntities] Dictionary<string, object> entities)
        {
            ArgumentNullException.ThrowIfNull(turnContext);
            ArgumentNullException.ThrowIfNull(turnState);
            var data = GetData(entities);
            var action = (data.Operation ?? string.Empty).Trim().ToLowerInvariant();
            switch (action)
            {
                case "change":
                case "update":
                    await UpdateLocationAsync(turnContext, turnState, data);
                    return true;
                default:
                    await turnContext.SendActivityAsync($"[location.{action}]");
                    return true;
            }
        }

        private static double GetEncounterChance(string title)
        {
            title = title.ToLowerInvariant();
            var location = Map.FindMapLocation(title);
            if (location != null)
            {
                return location.EncounterChance;
            }
            else if (title.IndexOf("dungeon") >= 0 || title.IndexOf("cave") >= 0)
            {
                return 0.4;
            }
            else
            {
                return 0.2;
            }
        }

        private static async Task UpdateLocationAsync(ITurnContext context, QuestState state, DataEntities data)
        {
            var currentLocation = state.Conversation!.Location;

            // Create new location object
            var title = (data.Title ?? string.Empty).Trim();
            var newLocation = new Location
            {
                Title = title,
                Description = (data.Description ?? string.Empty).Trim(),
                EncounterChance = GetEncounterChance(title)
            };

            // Has the location changed?
            // - Ignore the change if the location hasn't changed.
            if (!string.Equals(newLocation.Title, currentLocation?.Title, StringComparison.OrdinalIgnoreCase))
            {
                state.Conversation.LocationTurn += 1;
                await context.SendActivityAsync($"🧭 <strong>{newLocation.Title}</strong><br>{string.Join("<br>", newLocation.Description.Split('\n'))}");
            }

            state.Temp!.PlayerAnswered = true;
        }
    }
}
