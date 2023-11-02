using Microsoft.Bot.Builder;

namespace Microsoft.Teams.AI.State
{
    /// <summary>
    /// Interface implemented by classes responsible for loading and saving an applications turn state.
    /// </summary>
    /// <typeparam name="TState">Type of the state object being persisted.</typeparam>
    public interface ITurnStateManager<TState> where TState : ITurnState<StateBase, StateBase, TempState>
    {
        /// <summary>
        /// Loads all of the state scopes for the current turn.
        /// </summary>
        /// <param name="storage">Storage provider to load state scopes from.</param>
        /// <param name="turnContext">Context for the current turn of conversation with the user.</param>
        /// <returns>The loaded state scopes.</returns>
        Task<TState> LoadStateAsync(IStorage? storage, ITurnContext turnContext);

        /// <summary>
        /// Saves all of the state scopes for the current turn.
        /// </summary>
        /// <param name="storage">Storage provider to save state scopes to.</param>
        /// <param name="turnContext">Context for the current turn of conversation with the user.</param>
        /// <param name="turnState">State scopes to save.</param>
        Task SaveStateAsync(IStorage? storage, ITurnContext turnContext, TState turnState);
    }

}
