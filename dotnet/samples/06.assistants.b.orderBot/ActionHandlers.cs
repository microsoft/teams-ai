using Microsoft.Bot.Builder;
using Microsoft.Bot.Schema;
using Microsoft.Teams.AI.AI.Action;
using Microsoft.Teams.AI.AI;
using System.Text.Json;

namespace OrderBot
{
    public class ActionHandlers
    {
        [Action(AIConstants.HttpErrorActionName)]
        public async Task<string> OnHttpError([ActionTurnContext] ITurnContext turnContext)
        {
            await turnContext.SendActivityAsync("An AI request failed. Please try again later.");
            return AIConstants.StopCommand;
        }

        [Action("place_order")]
        public async Task<string> OnPlaceOrder([ActionTurnContext] ITurnContext turnContext, [ActionParameters] Dictionary<string, object> entities)
        {
            if (entities.ContainsKey("items"))
            {
                object items = entities["items"];
                List<Dictionary<string, object>>? order = JsonSerializer.Deserialize<List<Dictionary<string, object>>>(JsonSerializer.Serialize(items));
                if (order != null)
                {
                    Attachment card = CardBuilder.NewOrderAttachment(order);
                    await turnContext.SendActivityAsync(MessageFactory.Attachment(card));
                }
            }

            return "order placed";
        }
    }
}
