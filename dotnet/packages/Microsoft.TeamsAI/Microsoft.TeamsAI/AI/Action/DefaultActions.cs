using AdaptiveCards;
using Microsoft.TeamsAI.AI.Planner;
using Microsoft.TeamsAI.Exceptions;
using Microsoft.TeamsAI.State;
using Microsoft.TeamsAI.Utilities;
using Microsoft.Bot.Connector;
using Microsoft.Bot.Schema;
using Microsoft.Extensions.Logging;
using Microsoft.Bot.Builder;

namespace Microsoft.TeamsAI.AI.Action
{

    internal class DefaultActions<TState> where TState : ITurnState<StateBase, StateBase, TempState>
    {
        private readonly ILogger? _logger;

        public DefaultActions(ILogger? logger)
        {
            _logger = logger;
        }

        [Action(DefaultActionTypes.UnknownActionName)]
        public Task<bool> UnknownAction([ActionName] string action)
        {
            _logger?.LogError($"An AI action named \"{action}\" was predicted but no handler was registered");
            return Task.FromResult(true);
        }

        [Action(DefaultActionTypes.FlaggedInputActionName)]
        public Task<bool> FlaggedInputAction()
        {
            _logger?.LogError($"The users input has been moderated but no handler was registered for {DefaultActionTypes.FlaggedInputActionName}");
            return Task.FromResult(true);
        }

        [Action(DefaultActionTypes.FlaggedOutputActionName)]
        public Task<bool> FlaggedOutputAction()
        {
            _logger?.LogError($"The bots output has been moderated but no handler was registered for {DefaultActionTypes.FlaggedOutputActionName}");
            return Task.FromResult(true);
        }

        [Action(DefaultActionTypes.RateLimitedActionName)]
        public Task<bool> RateLimitedAction()
        {
            throw new TeamsAIException("An AI request failed because it was rate limited");
        }

        [Action(DefaultActionTypes.PlanReadyActionName)]
        public Task<bool> PlanReadyAction([ActionEntities] Plan plan)
        {
            Verify.ParamNotNull(plan);

            return Task.FromResult(plan.Commands.Count > 0);
        }

        [Action(DefaultActionTypes.DoCommandActionName)]
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

        [Action(DefaultActionTypes.SayCommandActionName)]
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
