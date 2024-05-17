using Microsoft.Teams.AI.AI.Planners;
using Microsoft.Teams.AI.Exceptions;
using Microsoft.Teams.AI.State;
using Microsoft.Teams.AI.Utilities;
using Microsoft.Bot.Connector;
using Microsoft.Extensions.Logging;
using Microsoft.Bot.Builder;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Teams.AI.AI.Models;
using Microsoft.Bot.Schema;

namespace Microsoft.Teams.AI.AI.Action
{
    internal class DefaultActions<TState> where TState : TurnState
    {
        private readonly ILogger _logger;
        private readonly bool _enableFeedbackLoop;

        public DefaultActions(bool enableFeedbackLoop = false, ILoggerFactory? loggerFactory = null)
        {
            _enableFeedbackLoop = enableFeedbackLoop;
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

        [Action(AIConstants.HttpErrorActionName, isDefault: true)]
        public Task<string> HttpErrorAction()
        {
            throw new TeamsAIException("An AI http request failed");
        }

        [Action(AIConstants.PlanReadyActionName, isDefault: true)]
        public Task<string> PlanReadyAction([ActionParameters] Plan plan)
        {
            Verify.ParamNotNull(plan);

            return Task.FromResult(plan.Commands.Count > 0 ? string.Empty : AIConstants.StopCommand);
        }

        [Action(AIConstants.DoCommandActionName, isDefault: true)]
        public async Task<string> DoCommandAsync([ActionTurnContext] ITurnContext turnContext, [ActionTurnState] TState turnState, [ActionParameters] DoCommandActionData<TState> doCommandActionData, CancellationToken cancellationToken = default)
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

            return await handler.PerformActionAsync(turnContext, turnState, doCommandActionData.PredictedDoCommand.Parameters, doCommandActionData.PredictedDoCommand.Action, cancellationToken);
        }

        [Action(AIConstants.SayCommandActionName, isDefault: true)]
        public async Task<string> SayCommandAsync([ActionTurnContext] ITurnContext turnContext, [ActionParameters] PredictedSayCommand command, CancellationToken cancellationToken = default)
        {
            Verify.ParamNotNull(command);
            Verify.ParamNotNull(command.Response);

            if (command.Response.Content == null || command.Response.Content == string.Empty)
            {
                return "";
            }

            string content = command.Response.Content;

            bool isTeamsChannel = turnContext.Activity.ChannelId == Channels.Msteams;

            if (isTeamsChannel)
            {
                content.Replace("\n", "<br>");
            }

            // If the response from the AI includes citations, those citations will be parsed and added to the SAY command.
            List<ClientCitation> citations = new();

            if (command.Response.Context != null && command.Response.Context.Citations.Count > 0)
            {
                int i = 0;
                foreach (Citation citation in command.Response.Context.Citations)
                {
                    string abs = CitationUtils.Snippet(citation.Content, 500);
                    if (isTeamsChannel)
                    {
                        content.Replace("\n", "<br>");
                    };

                    citations.Add(new ClientCitation()
                    {
                        Position = $"{i + 1}",
                        Appearance = new ClientCitationAppearance()
                        {
                            Name = citation.Title,
                            Abstract = abs
                        }
                    });
                    i++;
                }
            }

            // If there are citations, modify the content so that the sources are numbers instead of [doc1], [doc2], etc.
            string contentText = citations.Count == 0 ? content : CitationUtils.FormatCitationsResponse(content);

            // If there are citations, filter out the citations unused in content.
            List<ClientCitation>? referencedCitations = citations.Count > 0 ? CitationUtils.GetUsedCitations(contentText, citations) : new List<ClientCitation>();

            object? channelData = isTeamsChannel ? new
            {
                feedbackLoopEnabled = _enableFeedbackLoop
            } : null;

            AIEntity entity = new();
            if (referencedCitations != null)
            {
                entity.Citation = referencedCitations;
            }

            await turnContext.SendActivityAsync(new Activity()
            {
                Type = ActivityTypes.Message,
                Text = contentText,
                ChannelData = channelData,
                Entities = new List<Entity>() { entity }
            }, cancellationToken);

            return string.Empty;
        }

        [Action(AIConstants.TooManyStepsActionName, isDefault: true)]
        public Task<string> TooManyStepsAction([ActionParameters] TooManyStepsParameters parameters)
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
