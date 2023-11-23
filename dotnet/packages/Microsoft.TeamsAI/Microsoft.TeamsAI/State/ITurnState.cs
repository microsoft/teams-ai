
using Microsoft.Bot.Builder;

namespace Microsoft.Teams.AI.State
{
    /// <summary>
    /// The turn state interface.
    /// </summary>
    /// <typeparam name="TConversationState">The conversation state class.</typeparam>
    /// <typeparam name="TUserState">The user state class.</typeparam>
    /// <typeparam name="TTempState">The temp state class.</typeparam>
    public interface ITurnState<out TConversationState, out TUserState, out TTempState>
        where TConversationState : class
        where TUserState : class
        where TTempState : TempState
    {
        /// <summary>
        /// Gets the conversation state.
        /// </summary>
        public TConversationState? Conversation { get; }

        /// <summary>
        /// Gets the user state.
        /// </summary>
        public TUserState? User { get; }

        /// <summary>
        /// Gets the temp state.
        /// </summary>
        public TTempState? Temp { get; }

        /// <summary>
        /// Loads all of the state scopes for the current turn.
        /// </summary>
        /// <param name="storage">Optional. Storage provider to load state scopes from.</param>
        /// <param name="turnContext">Context for the current turn of conversation with the user.</param>
        /// <param name="cancellationToken"></param>
        /// <returns>True if the states need to be loaded.</returns>
        public Task<bool> LoadStateAsync(IStorage? storage, ITurnContext turnContext, CancellationToken cancellationToken = default);

        /// <summary>
        /// Saves all of the state scopes for the current turn.
        /// </summary>
        /// <param name="storage">Optional. Storage provider to save state scopes to.</param>
        /// <param name="turnContext">Context for the current turn of conversation with the user.</param>
        public Task SaveStateAsync(IStorage? storage, ITurnContext turnContext);
    }
}
