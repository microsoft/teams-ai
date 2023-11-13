using Microsoft.Teams.AI.AI.Planner;
using Microsoft.Teams.AI.Exceptions;
using Microsoft.Teams.AI.State;
using Microsoft.Teams.AI.Utilities;
using Microsoft.Bot.Connector;
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

        [Action(AIConstants.UnknownActionName, isDefault: true)]
        public Task<string> UnknownAction([ActionName] string action)
        {
            _logger.LogError($"An AI action named \"{action}\" was predicted but no handler was registered");
            return Task.FromResult(AIConstants.StopCommand);
        }

        [Action(AIConstants.FlaggedInputActionName, isDefault: true)]
        public Task<string> FlaggedInputAction()
        {
            _logger.LogError($"The users input has been moderated but no handler was registered for {AIConstants.FlaggedInputActionName}");
            return Task.FromResult(AIConstants.StopCommand);
        }

        [Action(AIConstants.FlaggedOutputActionName, isDefault: true)]
        public Task<string> FlaggedOutputAction()
        {
            _logger.LogError($"The bots output has been moderated but no handler was registered for {AIConstants.FlaggedOutputActionName}");
            return Task.FromResult(AIConstants.StopCommand);
        }

        [Action(AIConstants.RateLimitedActionName, isDefault: true)]
        public Task<string> RateLimitedAction()
        {
            throw new TeamsAIException("An AI request failed because it was rate limited");
        }

        [Action(AIConstants.PlanReadyActionName, isDefault: true)]
        public Task<string> PlanReadyAction([ActionEntities] Plan plan)
        {
            Verify.ParamNotNull(plan);

            return Task.FromResult(plan.Commands.Count > 0 ? string.Empty : AIConstants.StopCommand);
        }

        [Action(AIConstants.DoCommandActionName, isDefault: true)]
        public async Task<string> DoCommand([ActionTurnContext] ITurnContext turnContext, [ActionTurnState] TState turnState, [ActionEntities] DoCommandActionData<TState> doCommandActionData)
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

            return await handler.PerformAction(turnContext, turnState, doCommandActionData.PredictedDoCommand.Entities, doCommandActionData.PredictedDoCommand.Action);
        }

        [Action(AIConstants.SayCommandActionName, isDefault: true)]
        public async Task<string> SayCommand([ActionTurnContext] ITurnContext turnContext, [ActionEntities] PredictedSayCommand command)
        {
            Verify.ParamNotNull(command);

            string response = command.Response;
            if (turnContext.Activity.ChannelId == Channels.Msteams)
            {
                await turnContext.SendActivityAsync(response.Replace("\n", "<br>"));
            }
            else
            {
                await turnContext.SendActivityAsync(response);
            };

            return string.Empty;
        }

        [Action(AIConstants.TooManyStepsActionName, isDefault: true)]
        public Task<string> TooManyStepsAction([ActionEntities] TooManyStepsParameters parameters)
        {
            if (parameters.StepCount > parameters.MaxSteps)
            {
                throw new TeamsAIException("The AI system has exceeded the maximum number of steps allowed.");
            }
            else
            {
                throw new TeamsAIException("The AI system has exceeded the maximum amount of time allowed.");
            }
        }
    }
}
