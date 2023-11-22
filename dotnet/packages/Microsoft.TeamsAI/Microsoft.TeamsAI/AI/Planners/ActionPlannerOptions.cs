using Microsoft.Bot.Builder;
using Microsoft.Teams.AI.AI.Models;
using Microsoft.Teams.AI.AI.Prompts;
using Microsoft.Teams.AI.AI.Tokenizers;
using Microsoft.Teams.AI.State;

namespace Microsoft.Teams.AI.AI.Planners
{
    /// <summary>
    /// Options used to configure an `ActionPlanner` instance.
    /// </summary>
    /// <typeparam name="TState">Type of application state.</typeparam>
    public class ActionPlannerOptions<TState> where TState : TurnState, IMemory
    {
        /// <summary>
        /// Model instance to use.
        /// </summary>
        public IPromptCompletionModel Model { get; set; }

        /// <summary>
        /// Prompt manager used to manage prompts.
        /// </summary>
        public PromptManager Prompts { get; set; }

        /// <summary>
        /// The default prompt to use.
        /// </summary>
        /// <remarks>
        /// This can either be the name of a prompt template or a function that returns a prompt template.
        /// </remarks>
        public ActionPlannerPromptFactory DefaultPrompt { get; set; }

        /// <summary>
        /// Maximum number of repair attempts to make.
        /// </summary>
        /// <remarks>
        /// The ActionPlanner uses validators and a feedback loop to repair invalid responses returned
        /// by the model.This value controls the maximum number of repair attempts that will be made
        /// before returning an error.The default value is 3.
        /// </remarks>
        public int MaxRepairAttempts { get; set; } = 3;

        /// <summary>
        /// tokenizer to use.
        /// </summary>
        /// <remarks>
        /// If not specified, a new `GPTTokenizer` instance will be created.
        /// </remarks>
        public ITokenizer Tokenizer { get; set; } = new GPTTokenizer();

        /// <summary>
        /// If true, repair attempts will be logged to the console.
        /// </summary>
        /// <remarks>
        /// The default value is false.
        /// </remarks>
        public bool LogRepairs { get; set; } = false;

        /// <summary>
        /// Factory function used to create a prompt template.
        /// </summary>
        /// <param name="context"></param>
        /// <param name="state"></param>
        /// <param name="planner"></param>
        /// <returns></returns>
        public delegate Task<PromptTemplate> ActionPlannerPromptFactory(
            ITurnContext context,
            TState state,
            ActionPlanner<TState> planner
        );

        /// <summary>
        /// Creates an instance of `ActionPlannerOptions`.
        /// </summary>
        /// <param name="model">Model instance to use.</param>
        /// <param name="prompts">Prompt manager used to manage prompts.</param>
        /// <param name="defaultPrompt">The default prompt to use.</param>
        public ActionPlannerOptions(IPromptCompletionModel model, PromptManager prompts, ActionPlannerPromptFactory defaultPrompt)
        {
            this.Model = model;
            this.Prompts = prompts;
            this.DefaultPrompt = defaultPrompt;
        }
    }
}
