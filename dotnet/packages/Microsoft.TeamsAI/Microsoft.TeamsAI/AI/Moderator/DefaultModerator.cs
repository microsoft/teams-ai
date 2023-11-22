using Microsoft.Bot.Builder;
using Microsoft.Teams.AI.AI.Planners;
using Microsoft.Teams.AI.State;

namespace Microsoft.Teams.AI.AI.Moderator
{
    /// <summary>
    /// The default moderator that does nothing. Used when no moderator is specified.
    /// </summary>
    /// <typeparam name="TState">The turn state class.</typeparam>
    public class DefaultModerator<TState> : IModerator<TState> where TState : ITurnState<Record, Record, TempState>
    {
        /// <inheritdoc />
        public Task<Plan> ReviewOutputAsync(ITurnContext turnContext, TState turnState, Plan plan, CancellationToken cancellationToken = default)
        {
            // Pass
            return Task.FromResult(plan);
        }

        /// <inheritdoc />
        public Task<Plan?> ReviewInputAsync(ITurnContext turnContext, TState turnState, CancellationToken cancellationToken = default)
        {
            // Just allow input
            return Task.FromResult<Plan?>(null);
        }
    }
}
