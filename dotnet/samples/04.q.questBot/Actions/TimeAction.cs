using Microsoft.Bot.Builder;
using Microsoft.TeamsAI.AI.Action;
using QuestBot.Models;
using QuestBot.State;

namespace QuestBot.Actions
{
    public partial class QuestBotActions
    {
        [Action("time")]
        public async Task<bool> TimeAsync([ActionTurnContext] ITurnContext turnContext, [ActionTurnState] QuestState turnState, [ActionEntities] Dictionary<string, object> entities)
        {
            ArgumentNullException.ThrowIfNull(turnContext);
            ArgumentNullException.ThrowIfNull(turnState);
            var data = GetData(entities);
            var action = (data.Operation ?? string.Empty).Trim().ToLowerInvariant();
            switch (action)
            {
                case "wait":
                    return await WaitForTimeAsync(turnContext, turnState, data);
                case "query":
                    return await QueryTimeAsync(turnContext, turnState);
                default:
                    await turnContext.SendActivityAsync($"[time.{action}]");
                    return true;
            }
        }

        private static async Task<bool> QueryTimeAsync(ITurnContext context, QuestState state)
        {
            // Render conditions
            var conditions = Conditions.DescribeConditions(
                state.Conversation!.Time,
                state.Conversation!.Day,
                state.Conversation!.Temperature ?? string.Empty,
                state.Conversation!.Weather ?? string.Empty
            );

            // Say the current conditions to the player
            await UpdateDMResponseAsync(context, state, $"⏳ ${conditions}");
            state.Temp!.PlayerAnswered = true;
            return false;
        }

        private static async Task<bool> WaitForTimeAsync(ITurnContext context, QuestState state, DataEntities data)
        {
            var until = (data.Until ?? string.Empty).Trim();
            int.TryParse(data.Days, out var days);
            days = days < 0 ? 0 : days;
            if (!string.IsNullOrEmpty(until))
            {
                string? notification = null;
                state.Conversation!.Day += days;
                if (string.Equals(until, Conditions.TIME_DAWN, StringComparison.OrdinalIgnoreCase))
                {
                    state.Conversation.Time = 4;
                    if (days < 2)
                    {
                        notification = "⏳ crack of dawn";
                    }
                }
                else if (string.Equals(until, Conditions.TIME_NOON, StringComparison.OrdinalIgnoreCase))
                {
                    state.Conversation.Time = 12;
                    if (days == 0)
                    {
                        notification = "⏳ today at noon";
                    }
                    else if (days == 1)
                    {
                        notification = "⏳ tomorrow at noon";
                    }
                }
                else if (string.Equals(until, Conditions.TIME_AFTERNOON, StringComparison.OrdinalIgnoreCase))
                {
                    state.Conversation.Time = 14;
                    if (days == 0)
                    {
                        notification = "⏳ this afternoon";
                    }
                    else if (days == 1)
                    {
                        notification = "⏳ tomorrow afternoon";
                    }
                }
                else if (string.Equals(until, Conditions.TIME_EVENING, StringComparison.OrdinalIgnoreCase))
                {
                    state.Conversation.Time = 18;
                    if (days == 0)
                    {
                        notification = "⏳ this evening";
                    }
                    else if (days == 1)
                    {
                        notification = "⏳ tomorrow evening";
                    }
                }
                else if (string.Equals(until, Conditions.TIME_NIGHT, StringComparison.OrdinalIgnoreCase))
                {
                    state.Conversation.Time = 20;
                    if (days == 0)
                    {
                        notification = "⏳ tonight";
                    }
                    else if (days == 1)
                    {
                        notification = "⏳ tomorrow night";
                    }
                }
                else
                {
                    // default to morning
                    state.Conversation.Time = 6;
                    if (days == 0)
                    {
                        notification = "⏳ early morning";
                    }
                    else if (days == 1)
                    {
                        notification = "⏳ the next morning";
                    }
                }

                // Generate new weather
                if (days > 0)
                {
                    var season = Conditions.DescribeSeason(state.Conversation.Day);
                    state.Conversation.Temperature = Conditions.GenerateTemperature(season);
                    state.Conversation.Weather = Conditions.GenerateWeather(season);
                    state.Conversation.NextEncounterTurn = state.Conversation.Turn + (int)Math.Floor(Random.Shared.NextDouble() * 5) + 1;
                }

                // Notify player
                // - We don't consider this answering the players query. We want the story to be included
                //   for added color.
                await context.SendActivityAsync(notification ?? $"⏳ ${days} days later");
                return true;
            }
            else
            {
                // If the model calls "time action='wait'"" without any options, just return the current time of day.
                return await QueryTimeAsync(context, state);
            }
        }
    }
}
