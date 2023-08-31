using AdaptiveCards;
using Microsoft.Bot.Builder;
using Microsoft.Bot.Schema;
using Microsoft.TeamsAI.AI;
using Microsoft.TeamsAI.AI.Action;
using QuestBot.Models;
using QuestBot.State;

namespace QuestBot.Actions
{
    public partial class QuestBotActions
    {
        [Action("inventory")]
        public async Task<bool> InventoryAsync([ActionTurnContext] ITurnContext turnContext, [ActionTurnState] QuestState turnState, [ActionEntities] Dictionary<string, object> entities)
        {
            ArgumentNullException.ThrowIfNull(turnContext);
            ArgumentNullException.ThrowIfNull(turnState);
            var data = GetData(entities);
            var action = (data.Operation ?? string.Empty).Trim().ToLowerInvariant();
            switch (action)
            {
                case "update":
                    await UpdateListAsync(turnContext, turnState, data);
                    return true;
                case "list":
                    return await PrintListAsync(turnContext, turnState);
                default:
                    await turnContext.SendActivityAsync($"[inventory.{action}]");
                    return true;
            }
        }

        private async Task<bool> PrintListAsync(ITurnContext context, QuestState state)
        {
            var items = state.User!.Inventory;
            if (items != null && items.Count > 0)
            {
                state.Temp!.ListItems = items;
                state.Temp!.ListType = "inventory";
                var newResponse = await _application.AI.CompletePromptAsync(context, state, "listItems", null, default);
                if (!string.IsNullOrEmpty(newResponse))
                {
                    var card = ResponseParser.ParseAdaptiveCard(newResponse);
                    if (card != null)
                    {
                        await context.SendActivityAsync(MessageFactory.Attachment(new Attachment
                        {
                            ContentType = AdaptiveCard.ContentType,
                            Content = card.Card
                        }));
                        state.Temp.PlayerAnswered = true;
                        return true;
                    }
                }

                await UpdateDMResponseAsync(context, state, ResponseGenerator.DataError());
            }
            else
            {
                await UpdateDMResponseAsync(context, state, ResponseGenerator.EmptyInventory());
            }

            return false;
        }

        private static async Task UpdateListAsync(ITurnContext context, QuestState state, DataEntities data)
        {
            var newItems =
                state.User!.Inventory == null ?
                new ItemList() :
                new ItemList(state.User!.Inventory);

            // Remove items first
            var changes = new List<string>();
            var changeItems = ItemList.FromText(data.Items);
            foreach (var removeItem in changeItems)
            {
                // Normalize the items name and count
                // - This converts 'coins:1' to 'gold:10'
                var normalizedItem = ItemList.MapTo(removeItem.Key, removeItem.Value);
                if (string.IsNullOrEmpty(normalizedItem.Key))
                {
                    continue;
                }

                if (normalizedItem.Value > 0)
                {
                    // Add the item
                    if (newItems.ContainsKey(normalizedItem.Key))
                    {
                        newItems[normalizedItem.Key] += normalizedItem.Value;
                    }
                    else
                    {
                        newItems[normalizedItem.Key] = normalizedItem.Value;
                    }
                    changes.Add($"+{normalizedItem.Value} ({normalizedItem.Key})");
                }
                else if (normalizedItem.Value < 0)
                {
                    // remove the item
                    var keyToRemove = newItems.SearchItem(normalizedItem.Key);
                    if (!string.IsNullOrEmpty(keyToRemove))
                    {
                        if (normalizedItem.Value + newItems[keyToRemove] > 0)
                        {
                            changes.Add($"{normalizedItem.Value} ({keyToRemove})");
                            newItems[keyToRemove] += normalizedItem.Value;
                        }
                        else
                        {
                            // Hallucinating number of items in inventory
                            changes.Add($"{newItems[keyToRemove]} ({keyToRemove})");
                            newItems.Remove(keyToRemove);
                        }
                    }
                    else
                    {
                        // Hallucinating item as being in inventory
                        changes.Add($"{normalizedItem.Value} ({normalizedItem.Key})");
                    }
                }
            }

            // Report inventory changes to user
            var playerName = state.User.Name?.ToLowerInvariant() ?? string.Empty;
            await context.SendActivityAsync($"{playerName}: {string.Join(", ", changes)}");

            // Save inventory changes
            state.User.Inventory = newItems;
        }
    }
}
