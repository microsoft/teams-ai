using Microsoft.Bot.Builder.M365.Utilities;

namespace Microsoft.Bot.Builder.M365.State
{
    /// <summary>
    /// Defines the default state scopes persisted by the `DefaultTurnStateManager`.
    /// </summary>
    /// <typeparam name="TConversationState">Optional. Type of the conversation state object being persisted.</typeparam>
    /// <typeparam name="TUserState">Optional. Type of the user state object being persisted.</typeparam>
    /// <typeparam name="TTempState">Optional. Type of the temp state object being persisted.</typeparam>
    public class TurnState<TConversationState, TUserState, TTempState> : StateBase
        where TConversationState : StateBase
        where TUserState : StateBase
        where TTempState : TempState
    {
        public const string ConversationStateKey = "conversationState";
        public const string UserStateKey = "userState";
        public const string TempStateKey = "tempState";

        /// <summary>
        /// Stores all the conversation-related state.
        /// </summary>
        public TurnStateEntry<TConversationState>? ConversationState
        {
            get
            {
                return Get<TurnStateEntry<TConversationState>>(ConversationStateKey);
            }
            set
            {
                Verify.ParamNotNull(value, nameof(value));

                Set(ConversationStateKey, value!);
            }
        }

        /// <summary>
        /// Stores all the user related state.
        /// </summary>
        public TurnStateEntry<TUserState>? UserState
        {
            get
            {
                return Get<TurnStateEntry<TUserState>>(UserStateKey);
            }
            set
            {
                Verify.ParamNotNull(value, nameof(value));

                Set(UserStateKey, value!);
            }
        }

        /// <summary>
        /// Stores all the tmeporary state for the current turn.
        /// </summary>
        public TurnStateEntry<TTempState>? TempState
        {
            get
            {
                return Get<TurnStateEntry<TTempState>>(TempStateKey);
            }
            set
            {
                Verify.ParamNotNull(value, nameof(value));

                Set(TempStateKey, value!);
            }
        }
    }

    /// <summary>
    /// Defines the default state scopes persisted by the <see cref="TurnStateManager"/>.
    /// </summary>
    public class TurnState : TurnState<StateBase, StateBase, TempState> { }

}
