using Microsoft.Bot.Builder;
using Microsoft.TeamsAI.AI;
using Microsoft.TeamsAI.AI.Action;
using QuestBot.Models;
using QuestBot.State;
using System.Text.Json;

namespace QuestBot.Actions
{
    public partial class QuestBotActions
    {
        [Action("player")]
        public async Task<bool> PlayerAsync([ActionTurnContext] ITurnContext turnContext, [ActionTurnState] QuestState turnState, [ActionEntities] Dictionary<string, object> entities)
        {
            ArgumentNullException.ThrowIfNull(turnContext);
            ArgumentNullException.ThrowIfNull(turnState);
            var data = GetData(entities);
            var action = (data.Operation ?? string.Empty).Trim().ToLowerInvariant();
            switch (action)
            {
                case "update":
                    return await UpdatePlayerAsync(turnContext, turnState, data);
                default:
                    await turnContext.SendActivityAsync($"[player.{action}]");
                    return true;
            }
        }

        /// <summary>
        /// Updates the player's information.
        /// </summary>
        private async Task<bool> UpdatePlayerAsync(ITurnContext context, QuestState state, DataEntities data)
        {
            // Check for name change
            var newName = (data.Name ?? string.Empty).Trim();
            if (!string.IsNullOrEmpty(newName))
            {
                // Update players for current session
                var newPlayers =
                    state.Conversation!.Players == null ?
                    new List<string>() :
                    new List<string>(state.Conversation.Players);
                newPlayers.Remove(state.User!.Name ?? string.Empty);
                newPlayers.Add(newName);

                // Update name and notify user
                state.User.Name = newName;
            }

            // Check for change or default values
            // - Lets update everything on first name change
            var backstoryChange = (data.Backstory ?? string.Empty).Trim();
            if (string.IsNullOrEmpty(backstoryChange) && string.Equals(state.User!.Backstory, QuestUserState.DEFAULT_BACKSTORY))
            {
                backstoryChange = QuestUserState.DEFAULT_BACKSTORY;
            }

            var equippedChange = (data.Equipped ?? string.Empty).Trim();
            if (string.IsNullOrEmpty(equippedChange) && string.Equals(state.User!.Equipped, QuestUserState.DEFAULT_EQUIPPED))
            {
                equippedChange = QuestUserState.DEFAULT_EQUIPPED;
            }

            // Update backstory and equipped
            if (!string.IsNullOrEmpty(backstoryChange) || !string.IsNullOrEmpty(equippedChange))
            {
                state.Temp!.BackstoryChange = string.IsNullOrEmpty(backstoryChange) ? "no change" : backstoryChange;
                state.Temp!.EquippedChange = string.IsNullOrEmpty(equippedChange) ? "no change" : equippedChange;
                _application.AI.Prompts.Variables["backstoryChange"] = state.Temp!.BackstoryChange;
                _application.AI.Prompts.Variables["equippedChange"] = state.Temp!.EquippedChange;
                var update = await _application.AI.CompletePromptAsync(context, state, "UpdatePlayer", null, default);
                if (update == null)
                {
                    await UpdateDMResponseAsync(context, state, ResponseGenerator.DataError());
                    return false;
                }

                var objString = ResponseParser.ParseJSON(update)?.FirstOrDefault();
                if (objString == null)
                {
                    await UpdateDMResponseAsync(context, state, ResponseGenerator.DataError());
                    return false;
                }

                var userState = JsonSerializer.Deserialize<QuestUserState>(objString);
                if (userState == null)
                {
                    await UpdateDMResponseAsync(context, state, ResponseGenerator.DataError());
                    return false;
                }

                if (!string.IsNullOrWhiteSpace(userState.Backstory))
                {
                    state.User!.Backstory = userState.Backstory;
                }

                if (!string.IsNullOrWhiteSpace(userState.Equipped))
                {
                    state.User!.Equipped = userState.Equipped;
                }
            }

            // Build message
            var message = $"🤴 <strong>{state.User!.Name}</strong>";
            if (!string.IsNullOrEmpty(backstoryChange))
            {
                message += $"<br><strong>Backstory:</strong> {string.Join("<br>", state.User!.Backstory?.Split('\n') ?? Array.Empty<string>())}";
            }
            if (!string.IsNullOrEmpty(equippedChange))
            {
                message += $"<br><strong>Equipped:</strong> {string.Join("<br>", state.User!.Equipped?.Split('\n') ?? Array.Empty<string>())}";
            }

            await context.SendActivityAsync(message);
            state.Temp!.PlayerAnswered = true;

            return true;
        }
    }
}
