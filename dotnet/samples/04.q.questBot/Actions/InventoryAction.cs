using AdaptiveCards;
using Microsoft.Bot.Builder;
using Microsoft.Bot.Schema;
using Microsoft.TeamsAI.AI;
using QuestBot.State;

namespace QuestBot.Actions
{
    public partial class QuestBotActions
    {
        private async Task<bool> PrintList(ITurnContext context, QuestState state)
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
    }
}
