using Microsoft.Bot.Builder.M365.AI.Prompt;

namespace Microsoft.Bot.Builder.M365.AI.Planner
{
    /// <summary>
    /// A planner is responsible for generating a plan that the AI system will execute.
    /// </summary>
    public interface IPlanner<TState> where TState : TurnState
    {
        /// <summary>
        /// Completes a prompt without returning a plan.
        /// </summary>
        /// <param name="turnContext">Context for the current turn of conversation</param>
        /// <param name="turnState">Application state for the current turn of conversation</param>
        /// <param name="promptTemplate">Prompt template to complete</param>
        /// <param name="options">Configuration options for the AI system.</param>
        /// <param name="cancellationToken"></param>
        /// <returns>The response from the prompt.</returns>
        Task<string> CompletePromptAsync(TurnContext turnContext, TState turnState, PromptTemplate promptTemplate, AIOptions<TState> options, CancellationToken cancellationToken);

        /// <summary>
        /// Completes a prompt and generates a plan for the AI system to execute.
        /// </summary>
        /// <param name="turnContext">Context for the current turn of conversation</param>
        /// <param name="turnState">Application state for the current turn of conversation</param>
        /// <param name="promptTemplate">Prompt template to complete</param>
        /// <param name="options">Configuration options for the AI system.</param>
        /// <param name="cancellationToken"></param>
        /// <returns>The plan that was generated.</returns>
        Task<Plan> GeneratePlanAsync(TurnContext turnContext, TState turnState, PromptTemplate promptTemplate, AIOptions<TState> options, CancellationToken cancellationToken);
    }
}