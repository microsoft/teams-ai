using Microsoft.Bot.Builder;
using Microsoft.Extensions.Logging;
using Microsoft.Teams.AI.AI.Clients;
using Microsoft.Teams.AI.AI.Models;
using Microsoft.Teams.AI.AI.Prompts;
using Microsoft.Teams.AI.AI.Validators;
using Microsoft.Teams.AI.State;

namespace Microsoft.Teams.AI.AI.Planners
{
    /// <summary>
    /// A planner that uses a Large Language Model (LLM) to generate plans.
    /// </summary>
    /// <remarks>
    /// The ActionPlanner is a powerful planner that uses a LLM to generate plans. The planner can
    /// trigger parameterized actions and send text based responses to the user. The ActionPlanner
    /// supports the following advanced features:
    /// - Augmentations: Augmentations virtually eliminate the need for prompt engineering. Prompts
    ///   can be configured to use a named augmentation which will be automatically appended to the outgoing
    ///   prompt. Augmentations let the developer specify whether they want to support multi-step plans (sequence),
    ///   use OpenAI's functions support (functions), or create an AutoGPT style agent (monologue).
    /// - Validations: Validators are used to validate the response returned by the LLM and can guarantee
    ///   that the parameters passed to an action match a supplied schema. The validator used is automatically
    ///   selected based on the augmentation being used. Validators also prevent hallucinated action names
    ///   making it impossible for the LLM to trigger an action that doesn't exist.
    /// - Repair: The ActionPlanner will automatically attempt to repair invalid responses returned by the
    ///   LLM using a feedback loop. When a validation fails, the ActionPlanner sends the error back to the
    ///   model, along with an instruction asking it to fix its mistake. This feedback technique leads to a
    ///   dramatic reduction in the number of invalid responses returned by the model.
    /// </remarks>
    /// <typeparam name="TState">Type of application state.</typeparam>
    public class ActionPlanner<TState> : IPlanner<TState> where TState : TurnState
    {
        /// <summary>
        /// Options used to configure the planner.
        /// </summary>
        public readonly ActionPlannerOptions<TState> Options;

        private readonly ILoggerFactory? _logger;

        /// <summary>
        /// Creates a new `ActionPlanner` instance.
        /// </summary>
        /// <param name="options">Options used to configure the planner.</param>
        /// <param name="loggerFactory"></param>
        public ActionPlanner(ActionPlannerOptions<TState> options, ILoggerFactory? loggerFactory = null)
        {
            this.Options = options;
            this._logger = loggerFactory;
        }

        /// <summary>
        /// Gets the prompt completion model in use
        /// </summary>
        public IPromptCompletionModel Model { get => Options.Model; }

        /// <summary>
        /// Get the prompt manager in use
        /// </summary>
        public PromptManager Prompts { get => Options.Prompts; }

        /// <summary>
        /// Get the default prompt manager in use
        /// </summary>
        public ActionPlannerOptions<TState>.ActionPlannerPromptFactory DefaultPrompt { get => Options.DefaultPrompt; }

        /// <summary>
        /// Starts a new task.
        /// </summary>
        /// <remarks>
        /// This method is called when the AI system is ready to start a new task. The planner should
        /// generate a plan that the AI system will execute. Returning an empty plan signals that
        /// there is no work to be performed.
        ///
        /// The planner should take the users input from `state.temp.input`.
        /// </remarks>
        /// <param name="context">Context for the current turn of conversation.</param>
        /// <param name="state">Application state for the current turn of conversation.</param>
        /// <param name="ai">The AI system that is generating the plan.</param>
        /// <param name="cancellationToken"></param>
        /// <returns>The plan that was generated.</returns>
        public async Task<Plan> BeginTaskAsync(ITurnContext context, TState state, AI<TState> ai, CancellationToken cancellationToken = default)
        {
            return await ContinueTaskAsync(context, state, ai, cancellationToken);
        }

        /// <summary>
        /// Continues the current task.
        /// </summary>
        /// <remarks>
        /// This method is called when the AI system has finished executing the previous plan and is
        /// ready to continue the current task. The planner should generate a plan that the AI system
        /// will execute. Returning an empty plan signals that the task is completed and there is no work
        /// to be performed.
        ///
        /// The output from the last plan step that was executed is passed to the planner via `state.temp.input`.
        /// </remarks>
        /// <param name="context">Context for the current turn of conversation.</param>
        /// <param name="state">Application state for the current turn of conversation.</param>
        /// <param name="ai">The AI system that is generating the plan.</param>
        /// <param name="cancellationToken"></param>
        /// <returns>The plan that was generated.</returns>
        /// <exception cref="Exception">thrown when there was an issue generating a plan</exception>
        public async Task<Plan> ContinueTaskAsync(ITurnContext context, TState state, AI<TState> ai, CancellationToken cancellationToken = default)
        {
            PromptTemplate template = await this.Options.DefaultPrompt(context, state, this);
            PromptResponse response = await this.CompletePromptAsync(context, state, template, template.Augmentation, cancellationToken);

            if (response.Status != PromptResponseStatus.Success)
            {
                throw new Exception(response.Error?.Message ?? "[Action Planner]: an error has occurred");
            }

            Plan? plan = await template.Augmentation.CreatePlanFromResponseAsync(context, state, response, cancellationToken);

            if (plan == null)
            {
                throw new Exception("[Action Planner]: failed to create plan");
            }

            return plan;
        }

        /// <summary>
        /// Completes a prompt using an optional validator.
        /// </summary>
        /// <remarks>
        /// This method allows the developer to manually complete a prompt and access the models
        /// response. If a validator is specified, the response will be validated and repaired if
        /// necessary. If no validator is specified, the response will be returned as-is.
        ///
        /// If a validator like the `JsonResponseValidator` is used, the response returned will be
        /// a message containing a JSON object. If no validator is used, the response will be a
        /// message containing the response text as a string.
        /// </remarks>
        /// Type of message content returned for a 'success' response. The `response.message.content` field will be of type TContent. Defaults to `string`.
        /// <param name="context">Context for the current turn of conversation.</param>
        /// <param name="memory">A memory interface used to access state variables (the turn state object implements this interface.)</param>
        /// <param name="template">prompt template</param>
        /// <param name="validator">A validator to use to validate the response returned by the model.</param>
        /// <param name="cancellationToken"></param>
        /// <returns>The result of the LLM call.</returns>
        public async Task<PromptResponse> CompletePromptAsync(
            ITurnContext context,
            IMemory memory,
            PromptTemplate template,
            IPromptResponseValidator? validator,
            CancellationToken cancellationToken = default
        )
        {
            if (!this.Prompts.HasPrompt(template.Name))
            {
                this.Prompts.AddPrompt(template.Name, template);
            }

            string historyVariable = template.Configuration.Completion.IncludeHistory ?
                $"conversation.{template.Name}_history" :
                $"temp.{template.Name}_history";

            LLMClient<object> client = new(new(this.Model, template)
            {
                HistoryVariable = historyVariable,
                Validator = validator ?? new DefaultResponseValidator(),
                Tokenizer = this.Options.Tokenizer,
                MaxHistoryMessages = this.Prompts.Options.MaxHistoryMessages,
                MaxRepairAttempts = this.Options.MaxRepairAttempts,
                LogRepairs = this.Options.LogRepairs
            }, this._logger);

            return await client.CompletePromptAsync(context, memory, this.Prompts, cancellationToken);
        }
    }
}
