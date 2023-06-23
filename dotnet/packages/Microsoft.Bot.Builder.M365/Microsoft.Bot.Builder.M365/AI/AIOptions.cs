using Microsoft.Bot.Builder.M365.AI.Planner;
using Microsoft.Bot.Builder.M365.AI.Prompt;
using Microsoft.Bot.Builder.M365.Utilities;

namespace Microsoft.Bot.Builder.M365.AI
{
    public sealed class AIOptions<TState> where TState : TurnState
    {
        /// <summary>
        /// The planner to use for generating plans.
        /// </summary>
        public IPlanner<TState> Planner { get; set; }

        /// <summary>
        /// The prompt manager to use for generating prompts.
        /// </summary>
        public PromptManager<TState> PromptManager { get; set; }

        /// <summary>
        /// Optional. The moderator to use for moderating input passed to the model and the output
        /// returned by the model.
        /// </summary>
        public Moderator<TState> Moderator { get; set; }

        // TODO: Support PromptTemplate and PromptSelector handler as options
        /// <summary>
        /// Optional. The prompt to use for the current turn.
        /// </summary>
        /// <remarks>
        /// This allows for the use of the AI system in a free standing mode. An exception will be
        /// thrown if the AI system is routed to by the Application object and a prompt has not been
        /// configured.
        /// </remarks>
        public string? Prompt;

        /// <summary>
        /// Optional. The history options to use for the AI system
        /// </summary>
        /// <remarks>
        /// Defaults to tracking history with a maximum of 3 turns and 1000 tokens per turn.
        /// </remarks>
        public AIHistoryOptions? History;

        /// <summary>
        /// Initializes a new instance of the <see cref="AIOptions{TState}"/> class.
        /// </summary>
        /// <param name="planner">The planner to use for generating plans.</param>
        /// <param name="promptManager">The prompt manager to use for generating prompts.</param>
        /// <param name="moderator"> The moderator to use for moderating input passed to the model and the output</param>
        /// <param name="prompt">Optional. The prompt to use for the current turn.</param>
        /// <param name="history">Optional. The history options to use for the AI system.</param>
        public AIOptions(IPlanner<TState> planner, PromptManager<TState> promptManager, Moderator<TState> moderator, string? prompt = null, AIHistoryOptions? history = null)
        {
            Verify.NotNull(planner, nameof(planner));
            Verify.NotNull(promptManager, nameof(promptManager));
            Verify.NotNull(moderator, nameof(moderator));

            Planner = planner;
            PromptManager = promptManager;
            Moderator = moderator;
            Prompt = prompt;
            History = history;
        }
    }

}
