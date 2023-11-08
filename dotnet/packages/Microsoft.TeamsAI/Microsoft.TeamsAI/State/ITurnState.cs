
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
    }
}
