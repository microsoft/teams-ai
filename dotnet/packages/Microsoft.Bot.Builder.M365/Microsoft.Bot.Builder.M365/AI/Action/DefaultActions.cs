using AdaptiveCards;
using Microsoft.Bot.Builder.M365.AI.Planner;
using Microsoft.Bot.Builder.M365.Exceptions;
using Microsoft.Bot.Connector;
using Microsoft.Bot.Schema;

namespace Microsoft.Bot.Builder.M365.AI.Action
{
    public class DefaultActions<TState> where TState : TurnState
    {
        [Action(DefaultActionTypes.UnknownActionName)]
        public Task<bool> UnkownAction(ITurnContext turnContext, TState turnState, object data, string action)
        {
            // TODO: Log error
            return Task.FromResult(true);
        }

        [Action(DefaultActionTypes.FlaggedInputActionName)]
        public Task<bool> FlaggedInputAction(ITurnContext turnContext, TState turnState, object data, string action)
        {
            // TODO: Log error
            return Task.FromResult(true);
        }

        [Action(DefaultActionTypes.FlaggedOutputActionName)]
        public Task<bool> FlaggedOutputAction(ITurnContext turnContext, TState turnState, object data, string action)
        {
            // TODO: Log error
            return Task.FromResult(true);
        }

        [Action(DefaultActionTypes.RateLimitedActionName)]
        public Task<bool> RateLimitedAction(ITurnContext turnContext, TState turnState, object data, string action)
        {
            throw new AIException("An AI request failed because it was rate limited");
        }

        [Action(DefaultActionTypes.PlanReadyActionName)]
        public Task<bool> PlanReadyAction(ITurnContext turnContext, TState turnState, object data, string action)
        {
            Plan plan = data as Plan ?? throw new Exception("Unexpected `data` object: It should be a Plan object");

            return Task.FromResult(plan.Commands.Count > 0);
        }

        [Action(DefaultActionTypes.DoCommandActionName)]
        public Task<bool> DoCommand(ITurnContext turnContext, TState turnState, object data, string action)
        {
            DoCommandActionData<TState> doCommandActionData = data as DoCommandActionData<TState> ?? throw new Exception("Unexpected `data` object: It should be a PredictedDoCommand object");

            if (doCommandActionData.Handler == null)
            {
                throw new Exception("Unexpected `data` object: Handler does not exist");
            }

            if (doCommandActionData.PredictedDoCommand == null)
            {
                throw new Exception("Unexpected `data` object: PredictedDoCommand does not exist");
            }   

            ActionHandler<TState> handler = doCommandActionData.Handler;

            return handler.Invoke(turnContext, turnState, doCommandActionData.PredictedDoCommand.Entities, action);
        }

        [Action(DefaultActionTypes.SayCommandActionName)]
        public async Task<bool> SayCommand(ITurnContext turnContext, TState turnState, object data, string action)
        {
            PredictedSayCommand command = data as PredictedSayCommand ?? throw new Exception("Unexpected `data` object: It should be a PredictedDoCommand object");
            string response = command.Response;
            AdaptiveCardParseResult? card = ResponseParser.ParseAdaptiveCard(response);

            if (card != null)
            {
                // TODO: Log card warnings
                Attachment attachment = new() { Content = card, ContentType = AdaptiveCard.ContentType };
                IMessageActivity activity = MessageFactory.Attachment(attachment);
                await turnContext.SendActivityAsync(activity);
            }
            else if (turnContext.Activity.ChannelId == Channels.Msteams)
            {
                await turnContext.SendActivityAsync(response.Replace("\n", "<br>"));
            }
            else
            {
                await turnContext.SendActivityAsync(response);
            };

            return true;
        }
    }
}
