using Azure.AI.OpenAI.Assistants;
using Microsoft.Bot.Builder;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Teams.AI.Exceptions;
using Microsoft.Teams.AI.State;
using Microsoft.Teams.AI.Utilities;
using System.Runtime.CompilerServices;
using System.Text.Json;

// Assistants API is currently in beta and is subject to change.
#pragma warning disable IDE0130 // Namespace does not match folder structure
[assembly: InternalsVisibleTo("Microsoft.Teams.AI.Tests")]
namespace Microsoft.Teams.AI.AI.Planners.Experimental
#pragma warning restore IDE0130 // Namespace does not match folder structure
{
    /// <summary>
    /// A planner that uses OpenAI's Assistants APIs to generate plans.
    /// </summary>
    public class AssistantsPlanner<TState> : IPlanner<TState>
        where TState : TurnState, IAssistantsState
    {
        private static readonly TimeSpan DEFAULT_POLLING_INTERVAL = TimeSpan.FromSeconds(1);

        private readonly AssistantsPlannerOptions _options;
        private readonly AssistantsClient _client;
        private readonly ILogger _logger;

        /// <summary>
        /// Create new AssistantsPlanner.
        /// </summary>
        /// <param name="options">Options for configuring the AssistantsPlanner.</param>
        /// <param name="loggerFactory">The logger factory instance.</param>
        public AssistantsPlanner(AssistantsPlannerOptions options, ILoggerFactory? loggerFactory = null)
        {
            Verify.ParamNotNull(options);
            Verify.ParamNotNull(options.ApiKey, "AssistantsPlannerOptions.ApiKey");
            Verify.ParamNotNull(options.AssistantId, "AssistantsPlannerOptions.AssistantId");

            _options = new AssistantsPlannerOptions(options.ApiKey, options.AssistantId)
            {
                Organization = options.Organization,
                PollingInterval = options.PollingInterval ?? DEFAULT_POLLING_INTERVAL
            };
            _logger = loggerFactory == null ? NullLogger.Instance : loggerFactory.CreateLogger<AssistantsPlanner<TState>>();
            _client = _CreateClient(options.ApiKey, options.Endpoint);

        }

        /// <summary>
        /// Static helper method for programmatically creating an assistant.
        /// </summary>
        /// <param name="apiKey">OpenAI or Azure OpenAI API key.</param>
        /// <param name="request">Definition of the assistant to create.</param>
        /// <param name="endpoint">Azure OpenAI API Endpoint.</param>
        /// <param name="cancellationToken">A cancellation token that can be used by other objects
        /// or threads to receive notice of cancellation.</param>
        /// <returns>The created assistant.</returns>
        public static async Task<Assistant> CreateAssistantAsync(string apiKey, AssistantCreationOptions request, string? endpoint = null, CancellationToken cancellationToken = default)
        {
            Verify.ParamNotNull(apiKey);
            Verify.ParamNotNull(request);

            AssistantsClient client = _CreateClient(apiKey, endpoint);

            return await client.CreateAssistantAsync(request, cancellationToken);
        }

        /// <inheritdoc/>
        public async Task<Plan> BeginTaskAsync(ITurnContext turnContext, TState turnState, AI<TState> ai, CancellationToken cancellationToken)
        {
            Verify.ParamNotNull(turnContext);
            Verify.ParamNotNull(turnState);
            Verify.ParamNotNull(ai);
            return await ContinueTaskAsync(turnContext, turnState, ai, cancellationToken);
        }

        /// <inheritdoc/>
        public async Task<Plan> ContinueTaskAsync(ITurnContext turnContext, TState turnState, AI<TState> ai, CancellationToken cancellationToken)
        {
            Verify.ParamNotNull(turnContext);
            Verify.ParamNotNull(turnState);
            Verify.ParamNotNull(ai);

            // Create a new thread if we don't have one already
            string threadId = await _EnsureThreadCreatedAsync(turnState, cancellationToken);

            // Add the users input to the thread or send tool outputs
            if (turnState.SubmitToolOutputs)
            {
                // Send the tool output to the assistant
                return await _SubmitActionResultsAsync(turnState, cancellationToken);
            }
            else
            {
                // Wait for any current runs to complete since you can't add messages or start new runs
                // if there's already one in progress
                await _BlockOnInProgressRunsAsync(threadId, cancellationToken);

                // Submit user input
                return await _SubmitUserInputAsync(turnState, cancellationToken);
            }
        }

        private async Task<string> _EnsureThreadCreatedAsync(TState state, CancellationToken cancellationToken)
        {
            if (state.ThreadId == null)
            {
                AssistantThread thread = await _client.CreateThreadAsync(new(), cancellationToken);
                state.ThreadId = thread.Id;
            }

            return state.ThreadId;
        }

        private bool _IsRunCompleted(ThreadRun run)
        {
            RunStatus[] completionStatus = new[] { RunStatus.Completed, RunStatus.Failed, RunStatus.Expired, RunStatus.Cancelled };
            return completionStatus.Contains(run.Status);
        }

        private async Task<ThreadRun> _WaitForRunAsync(string threadId, string runId, bool handleActions, CancellationToken cancellationToken)
        {
            while (true)
            {
                await Task.Delay((TimeSpan)_options.PollingInterval!, cancellationToken);

                ThreadRun run = await _client.GetRunAsync(threadId, runId, cancellationToken);
                RunStatus[] completionStatus = new[] { RunStatus.Completed, RunStatus.Failed, RunStatus.Expired, RunStatus.Cancelled };


                if ((run.Status == RunStatus.RequiresAction && handleActions) || completionStatus.Contains(run.Status))
                {
                    return run;
                }
            }
        }

        private async Task _BlockOnInProgressRunsAsync(string threadId, CancellationToken cancellationToken)
        {
            // Loop until the last run is completed
            while (true)
            {
                PageableList<ThreadRun>? runs = await _client.GetRunsAsync(threadId, null, null, null, null, cancellationToken);

                if (runs == null || runs.Count() == 0)
                {
                    return;
                }

                ThreadRun? run = runs.ElementAt(0);
                if (run == null || _IsRunCompleted(run))
                {
                    return;
                }

                // Wait for the current run to complete and then loop to see if there's already a new run.
                await _WaitForRunAsync(threadId, run.Id, false, cancellationToken);
            }
        }

        private async Task<Plan> _GeneratePlanFromMessagesAsync(string threadId, string lastMessageId, CancellationToken cancellationToken)
        {
            // Find the new messages
            PageableList<ThreadMessage> messages = await _client.GetMessagesAsync(threadId, null, null, null, lastMessageId, cancellationToken);
            List<ThreadMessage> newMessages = new();
            foreach (ThreadMessage message in messages)
            {
                if (string.Equals(message.Id, lastMessageId))
                {
                    break;
                }
                else
                {
                    newMessages.Add(message);
                }
            }

            // ListMessages return messages in desc, reverse to be in asc order
            newMessages.Reverse();

            // Convert the messages to SAY commands
            Plan plan = new();
            foreach (ThreadMessage message in newMessages)
            {
                foreach (MessageContent content in message.ContentItems)
                {
                    if (content is MessageTextContent textMessage)
                    {
                        plan.Commands.Add(new PredictedSayCommand(textMessage.Text ?? string.Empty));
                    }
                }
            }
            return plan;
        }

        private Plan _GeneratePlanFromTools(TState state, SubmitToolOutputsAction submitToolOutputsAction)
        {
            Plan plan = new();
            Dictionary<string, string> toolMap = new();
            foreach (RequiredToolCall toolCall in submitToolOutputsAction.ToolCalls)
            {
                RequiredFunctionToolCall? functionToolCall = toolCall as RequiredFunctionToolCall;
                if (functionToolCall == null)
                {
                    return plan;
                }

                // TODO: Potential bug if assistant predicts same tool twice.
                toolMap[functionToolCall!.Name] = toolCall.Id;
                plan.Commands.Add(new PredictedDoCommand
                (
                    functionToolCall.Name,
                    JsonSerializer.Deserialize<Dictionary<string, object?>>(functionToolCall.Arguments)
                    ?? new Dictionary<string, object?>()
                ));
            }
            state.SubmitToolMap = toolMap;
            return plan;
        }

        private async Task<Plan> _SubmitActionResultsAsync(TState state, CancellationToken cancellationToken)
        {
            // Map the action outputs to tool outputs
            List<ToolOutput> toolOutputs = new();
            Dictionary<string, string> toolMap = state.SubmitToolMap;
            foreach (KeyValuePair<string, string> requiredAction in toolMap)
            {
                toolOutputs.Add(new()
                {
                    ToolCallId = requiredAction.Value,
                    Output = state.Temp!.ActionOutputs.ContainsKey(requiredAction.Key) ? state.Temp!.ActionOutputs[requiredAction.Key] : string.Empty
                });
            }

            // Submit the tool outputs
            ThreadRun run = await _client.SubmitToolOutputsToRunAsync(state.ThreadId!, state.RunId!, toolOutputs, cancellationToken);

            // Wait for the run to complete
            ThreadRun result = await _WaitForRunAsync(state.ThreadId!, run.Id, true, cancellationToken);

            if (result.Status == RunStatus.RequiresAction)
            {
                SubmitToolOutputsAction? submitToolOutputs = result.RequiredAction as SubmitToolOutputsAction;

                if (submitToolOutputs == null)
                {
                    return new Plan();
                }

                state.SubmitToolOutputs = true;

                return _GeneratePlanFromTools(state, submitToolOutputs);
            }
            else if (result.Status == RunStatus.Completed)
            {
                state.SubmitToolOutputs = false;
                return await _GeneratePlanFromMessagesAsync(state.ThreadId!, state.LastMessageId!, cancellationToken);
            }
            else if (result.Status == RunStatus.Cancelled)
            {
                return new Plan();
            }
            else if (result.Status == RunStatus.Expired)
            {
                return new Plan(new() { new PredictedDoCommand(AIConstants.TooManyStepsActionName) });
            }
            else
            {
                throw new TeamsAIException($"Run failed {result.Status}. ErrorCode: {result.LastError?.Code}. ErrorMessage: {result.LastError?.Message}");
            }
        }

        private async Task<Plan> _SubmitUserInputAsync(TState state, CancellationToken cancellationToken)
        {
            // Get the current thread_id
            string threadId = await _EnsureThreadCreatedAsync(state, cancellationToken);

            // Add the users input to the thread
            ThreadMessage message = await _client.CreateMessageAsync(threadId, "user", state.Temp?.Input ?? string.Empty, null, null, cancellationToken);

            // Create a new run
            ThreadRun run = await _client.CreateRunAsync(threadId, new(_options.AssistantId), cancellationToken);

            // Update state and wait for the run to complete
            state.ThreadId = threadId;
            state.RunId = run.Id;
            state.LastMessageId = message.Id;
            ThreadRun result = await _WaitForRunAsync(threadId, run.Id, true, cancellationToken);

            if (result.Status == RunStatus.RequiresAction)
            {
                SubmitToolOutputsAction? submitToolOutputs = result.RequiredAction as SubmitToolOutputsAction;

                if (submitToolOutputs == null)
                {
                    return new Plan();
                }

                state.SubmitToolOutputs = true;

                return _GeneratePlanFromTools(state, submitToolOutputs);
            }
            else if (result.Status == RunStatus.Completed)
            {
                state.SubmitToolOutputs = false;
                return await _GeneratePlanFromMessagesAsync(state.ThreadId!, state.LastMessageId!, cancellationToken);
            }
            else if (result.Status == RunStatus.Cancelled)
            {
                return new Plan();
            }
            else if (result.Status == RunStatus.Expired)
            {
                return new Plan(new() { new PredictedDoCommand(AIConstants.TooManyStepsActionName) });
            }
            else
            {
                throw new TeamsAIException($"Run failed {result.Status}. ErrorCode: {result.LastError?.Code}. ErrorMessage: {result.LastError?.Message}");
            }
        }

        internal static AssistantsClient _CreateClient(string apiKey, string? endpoint = null)
        {
            Verify.ParamNotNull(apiKey);

            if (endpoint != null)
            {
                // Azure OpenAI
                return new AssistantsClient(new Uri(endpoint), new Azure.AzureKeyCredential(apiKey));
            }
            else
            {
                // OpenAI
                return new AssistantsClient(apiKey);
            }
        }
    }
}
