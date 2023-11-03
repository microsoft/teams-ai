using Microsoft.Bot.Builder;
using Microsoft.Teams.AI.AI.Prompt;
using Microsoft.Teams.AI.State;

namespace Microsoft.Teams.AI.AI.Planner
{
    /// <summary>
    /// A planner is responsible for generating a plan that the AI system will execute.
    /// </summary>
    public interface IPlanner<TState> where TState : ITurnState<StateBase, StateBase, TempState>
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
        Task<string> CompletePromptAsync(ITurnContext turnContext, TState turnState, PromptTemplate promptTemplate, AIOptions<TState> options, CancellationToken cancellationToken);

        /// <summary>
        /// Completes a prompt and generates a plan for the AI system to execute.
        /// </summary>
        /// <param name="turnContext">Context for the current turn of conversation</param>
        /// <param name="turnState">Application state for the current turn of conversation</param>
        /// <param name="promptTemplate">Prompt template to complete</param>
        /// <param name="options">Configuration options for the AI system.</param>
        /// <param name="cancellationToken"></param>
        /// <returns>The plan that was generated.</returns>
        Task<Plan> GeneratePlanAsync(ITurnContext turnContext, TState turnState, PromptTemplate promptTemplate, AIOptions<TState> options, CancellationToken cancellationToken);
    }
}
