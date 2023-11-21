using Microsoft.Bot.Builder;
using Microsoft.Teams.AI.AI.OpenAI;
using Microsoft.Teams.AI.AI.OpenAI.Models;
using Microsoft.Teams.AI.State;
using Microsoft.Teams.AI.Utilities;

namespace Microsoft.Teams.AI.AI.Planner
{
    /// <summary>
    /// A planner that uses OpenAI's Assistants APIs to generate plans.
    /// </summary>
    public class AssistantsPlanner<TState> : IPlanner<TState>
        where TState : ITurnState<StateBase, StateBase, TempState>
    {
        private static readonly TimeSpan DEFAULT_POLLING_INTERVAL = TimeSpan.FromSeconds(1);
        private static readonly string DEFAULT_ASSISTANTS_STATE_VARIABLE = "conversation.assistants_state";
        private static readonly string SUBMIT_TOOL_OUTPUTS_VARIABLE = "temp.submit_tool_outputs";
        private static readonly string SUBMIT_TOOL_OUTPUTS_MAP = "temp.submit_tool_map";

        private readonly AssistantsPlannerOptions _options;
        private readonly OpenAIClient _openAIClient;

        /// <summary>
        /// Static helper method for programmatically creating an assistant.
        /// </summary>
        /// <param name="apiKey">OpenAI API key.</param>
        /// <param name="organization">OpenAI organization.</param>
        /// <param name="request">Definition of the assistant to create.</param>
        /// <param name="cancellationToken">A cancellation token that can be used by other objects
        /// or threads to receive notice of cancellation.</param>
        /// <returns>The created assistant.</returns>
        public static async Task<Assistant> CreateAssistantAsync(string apiKey, string? organization, AssistantCreateParams request, CancellationToken cancellationToken = default)
        {
            Verify.ParamNotNull(apiKey);
            Verify.ParamNotNull(request);

            OpenAIClient client = new(new OpenAIClientOptions(apiKey)
            {
                Organization = organization
            });

            return await client.CreateAssistant(request, cancellationToken);
        }

        /// <summary>
        /// Create new AssistantsPlanner.
        /// </summary>
        /// <param name="options">Options for configuring the AssistantsPlanner.</param>
        public AssistantsPlanner(AssistantsPlannerOptions options)
        {
            Verify.ParamNotNull(options);
            Verify.ParamNotNull(options.ApiKey, "AssistantsPlannerOptions.ApiKey");
            Verify.ParamNotNull(options.AssistantId, "AssistantsPlannerOptions.AssistantId");

            _options = new AssistantsPlannerOptions(options.ApiKey, options.AssistantId)
            {
                Organization = options.Organization,
                PollingInterval = options.PollingInterval ?? DEFAULT_POLLING_INTERVAL,
                AssistantsStateVariable = options.AssistantsStateVariable ?? DEFAULT_ASSISTANTS_STATE_VARIABLE
            };
            _openAIClient = new OpenAIClient(new OpenAIClientOptions(_options.ApiKey)
            {
                Organization = _options.Organization
            });
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

            return await Task.FromResult(new Plan());
        }

        private AssistantsState _EnsureAssistantsState(TState state)
        {
            // TODO
            return new AssistantsState();
        }

        private async Task<string> _EnsureThreadCreated(TState state, CancellationToken cancellationToken)
        {
            AssistantsState assistantState = _EnsureAssistantsState(state);
            if (assistantState.ThreadId == null)
            {
                OpenAI.Models.Thread thread = await _openAIClient.CreateThread(new(), cancellationToken);
                assistantState.ThreadId = thread.Id;
                // TODO updateAssistantsState
            }

            return assistantState.ThreadId;
        }

        private bool _IsRunCompleted(Run run)
        {
            switch (run.Status)
            {
                case "completed":
                case "failed":
                case "cancelled":
                case "expired":
                    return true;
                default: return false;
            }
        }

        private async Task<Run> _WaitForRun(string threadId, string runId, bool handleActions, CancellationToken cancellationToken)
        {
            while (true)
            {
                await Task.Delay((TimeSpan)_options.PollingInterval!, cancellationToken);

                Run run = await _openAIClient.RetrieveRun(threadId, runId, cancellationToken);
                switch (run.Status)
                {
                    case "requires_action":
                        if (handleActions)
                        {
                            return run;
                        }
                        break;
                    case "cancelled":
                    case "failed":
                    case "completed":
                    case "expired":
                        return run;
                    default:
                        break;
                }
            }
        }

        private async Task _BlockOnInProgressRuns(string threadId, CancellationToken cancellationToken)
        {
            // Loop until the last run is completed
            while (true)
            {
                Run? run = await _openAIClient.RetrieveLastRun(threadId, cancellationToken);
                if (run == null || _IsRunCompleted(run))
                {
                    return;
                }

                // Wait for the current run to complete and then loop to see if there's already a new run.
                await _WaitForRun(threadId, run.Id, false, cancellationToken);
            }
        }
    }
}
