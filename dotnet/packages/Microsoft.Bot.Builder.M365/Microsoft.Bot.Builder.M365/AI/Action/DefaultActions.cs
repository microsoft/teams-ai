using AdaptiveCards;
using Microsoft.Bot.Builder.M365.AI.Planner;
using Microsoft.Bot.Builder.M365.Exceptions;
using Microsoft.Bot.Builder.M365.State;
using Microsoft.Bot.Connector;
using Microsoft.Bot.Schema;
using Microsoft.Extensions.Logging;

namespace Microsoft.Bot.Builder.M365.AI.Action
{   
    // Create work item
    // TODO: Resolve this issue before private preview. Need more research and thinking. How are developers going to use this?
    // 1. Unused parameters, 2. Making the data parameter type more explicit and not just "object".
    public class DefaultActions<TState> where TState : ITurnState<StateBase, StateBase, TempState>
    {
        private readonly ILogger? _logger;

        public DefaultActions(ILogger? logger)
        {
            _logger = logger;
        }

        [Action(DefaultActionTypes.UnknownActionName)]
        public Task<bool> UnkownAction(ITurnContext turnContext, TState turnState, object data, string action)
        {
            _logger?.LogError($"An AI action named \"{action}\" was predicted but no handler was registered");
            return Task.FromResult(true);
        }

        [Action(DefaultActionTypes.FlaggedInputActionName)]
        public Task<bool> FlaggedInputAction(ITurnContext turnContext, TState turnState, object data, string action)
        {
            _logger?.LogError($"The users input has been moderated but no handler was registered for ${DefaultActionTypes.FlaggedInputActionName}");
            return Task.FromResult(true);
        }

        [Action(DefaultActionTypes.FlaggedOutputActionName)]
        public Task<bool> FlaggedOutputAction(ITurnContext turnContext, TState turnState, object data, string action)
        {
            _logger?.LogError($"The bots output has been moderated but no handler was registered for ${DefaultActionTypes.FlaggedOutputActionName}");
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
            Plan plan = data as Plan ?? throw new ArgumentException("Unexpected `data` object: It should be a Plan object");

            return Task.FromResult(plan.Commands.Count > 0);
        }

        [Action(DefaultActionTypes.DoCommandActionName)]
        public Task<bool> DoCommand(ITurnContext turnContext, TState turnState, object data, string action)
        {
            DoCommandActionData<TState> doCommandActionData = data as DoCommandActionData<TState> ?? throw new ArgumentException("Unexpected `data` object: It should be a PredictedDoCommand object");

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
            PredictedSayCommand command = data as PredictedSayCommand ?? throw new ArgumentException("Unexpected `data` object: It should be a PredictedDoCommand object");
            string response = command.Response;
            AdaptiveCardParseResult? card = ResponseParser.ParseAdaptiveCard(response);

            if (card != null)
            {
                if (card.Warnings.Count > 0)
                {
                    string warnings = string.Join("\n", card.Warnings.Select(w => w.Message));
                    _logger?.LogWarning($"{card.Warnings.Count} warnings found in the model generated adaptive card:\n {warnings}");
                }

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
