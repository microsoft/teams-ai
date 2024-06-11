using CardGazer.Model;
using Microsoft.Bot.Builder;
using Microsoft.Teams.AI.AI.Action;
using Microsoft.Teams.AI.AI;
using AdaptiveCards;
using Microsoft.Bot.Schema;
using System.Text.Json;

namespace CardGazer
{
    public class CardGazerBotActions
    {
        [Action("SendCard")]
        public async Task<string> SendCard([ActionTurnContext] ITurnContext turnContext, [ActionTurnState] AppState turnState, [ActionParameters] Dictionary<string, object> args)
        {

            if (args.TryGetValue("card", out object? cardObject) && cardObject is JsonElement cardJson)
            {
                // Deserialize the JSON string to an AdaptiveCard object
                AdaptiveCardParseResult parseResult = AdaptiveCard.FromJson(cardJson.ToString());

                // Get the AdaptiveCard object
                AdaptiveCard adaptiveCard = parseResult.Card;

                Attachment card = new Attachment()
                {
                    ContentType = AdaptiveCard.ContentType,
                    Content = adaptiveCard
                };

                await turnContext.SendActivityAsync(MessageFactory.Attachment(card));

                return "card sent";
            }

            return "failed to parsed card from action arguments";
        }

        [Action("ShowCardJSON")]
        public async Task<string> ShowCardJSON([ActionTurnContext] ITurnContext turnContext, [ActionTurnState] AppState turnState, [ActionParameters] Dictionary<string, object> args)
        {
            if (args.TryGetValue("card", out object? cardObject) && cardObject is JsonElement cardJson)
            {
                string cardString = cardJson.ToString();

                await turnContext.SendActivityAsync($"<pre>{cardString}</pre>");

                return "card displayed";
            }

            return "failed to parsed card from action arguments";
        }

        [Action(AIConstants.UnknownActionName)]
        public async Task<string> UnknownAction([ActionTurnContext] TurnContext turnContext, [ActionName] string action)
        {
            await turnContext.SendActivityAsync(ResponseGenerator.UnknownAction(action ?? "Unknown"));
            return "unknown action";
        }
    }
}
