using Microsoft.Bot.Builder;
using Microsoft.TeamsAI.AI.Planner;
using Microsoft.TeamsAI.AI.Prompt;
using Microsoft.TeamsAI.State;

namespace Microsoft.TeamsAI.AI.Moderator
{
    /// <summary>
    /// The default moderator that does nothing. Used when no moderator is specified.
    /// </summary>
    /// <typeparam name="TState">The turn state class.</typeparam>
    public class DefaultModerator<TState> : IModerator<TState> where TState : ITurnState<StateBase, StateBase, TempState>
    {
        /// <inheritdoc />
        public Task<Plan> ReviewPlan(ITurnContext turnContext, TState turnState, Plan plan)
        {
            // Pass
            return Task.FromResult(plan);
        }

        /// <inheritdoc />
        public Task<Plan?> ReviewPrompt(ITurnContext turnContext, TState turnState, PromptTemplate prompt)
        {
            return Task.FromResult<Plan?>(null);
        }
    }
}
