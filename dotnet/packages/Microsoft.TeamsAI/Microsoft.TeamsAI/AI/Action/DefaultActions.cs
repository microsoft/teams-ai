using AdaptiveCards;
using Microsoft.Teams.AI.AI.Planner;
using Microsoft.Teams.AI.Exceptions;
using Microsoft.Teams.AI.State;
using Microsoft.Teams.AI.Utilities;
using Microsoft.Bot.Connector;
using Microsoft.Bot.Schema;
using Microsoft.Extensions.Logging;
using Microsoft.Bot.Builder;
using Microsoft.Extensions.Logging.Abstractions;

namespace Microsoft.Teams.AI.AI.Action
{

    internal class DefaultActions<TState> where TState : ITurnState<StateBase, StateBase, TempState>
    {
        private readonly ILogger _logger;

        public DefaultActions(ILoggerFactory? loggerFactory = null)
        {
            _logger = loggerFactory is null ? NullLogger.Instance : loggerFactory.CreateLogger(typeof(DefaultActions<TState>));
        }

        [Action(AIConstants.UnknownActionName)]
        public Task<bool> UnknownAction([ActionName] string action)
        {
            _logger.LogError($"An AI action named \"{action}\" was predicted but no handler was registered");
            return Task.FromResult(true);
        }

        [Action(AIConstants.FlaggedInputActionName)]
        public Task<bool> FlaggedInputAction()
        {
            _logger.LogError($"The users input has been moderated but no handler was registered for {AIConstants.FlaggedInputActionName}");
            return Task.FromResult(true);
        }

        [Action(AIConstants.FlaggedOutputActionName)]
        public Task<bool> FlaggedOutputAction()
        {
            _logger.LogError($"The bots output has been moderated but no handler was registered for {AIConstants.FlaggedOutputActionName}");
            return Task.FromResult(true);
        }

        [Action(AIConstants.RateLimitedActionName)]
        public Task<bool> RateLimitedAction()
        {
            throw new TeamsAIException("An AI request failed because it was rate limited");
        }

        [Action(AIConstants.PlanReadyActionName)]
        public Task<bool> PlanReadyAction([ActionEntities] Plan plan)
        {
            Verify.ParamNotNull(plan);

            return Task.FromResult(plan.Commands.Count > 0);
        }

        [Action(AIConstants.DoCommandActionName)]
        public Task<bool> DoCommand([ActionTurnContext] ITurnContext turnContext, [ActionTurnState] TState turnState, [ActionEntities] DoCommandActionData<TState> doCommandActionData)
        {
            Verify.ParamNotNull(doCommandActionData);

            if (doCommandActionData.Handler == null)
            {
                throw new ArgumentException("Unexpected `data` object: Handler does not exist");
            }

            if (doCommandActionData.PredictedDoCommand == null)
            {
                throw new ArgumentException("Unexpected `data` object: PredictedDoCommand does not exist");
            }

            IActionHandler<TState> handler = doCommandActionData.Handler;

            return handler.PerformAction(turnContext, turnState, doCommandActionData.PredictedDoCommand.Entities, doCommandActionData.PredictedDoCommand.Action);
        }

        [Action(AIConstants.SayCommandActionName)]
        public async Task<bool> SayCommand([ActionTurnContext] ITurnContext turnContext, [ActionEntities] PredictedSayCommand command)
        {
            Verify.ParamNotNull(command);

            string response = command.Response;
            AdaptiveCardParseResult? card = ResponseParser.ParseAdaptiveCard(response);

            if (card != null)
            {
                if (card.Warnings.Count > 0)
                {
                    string warnings = string.Join("\n", card.Warnings.Select(w => w.Message));
                    _logger?.LogWarning($"{card.Warnings.Count} warnings found in the model generated adaptive card:\n {warnings}");
                }

                Attachment attachment = new() { Content = card.Card, ContentType = AdaptiveCard.ContentType };
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
