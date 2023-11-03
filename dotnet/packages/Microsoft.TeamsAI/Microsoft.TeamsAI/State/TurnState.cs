using Microsoft.Teams.AI.Utilities;

namespace Microsoft.Teams.AI.State
{
    /// <summary>
    /// Defines the default state scopes persisted by the <see cref="TurnStateManager{TurnState, TConversationState, TUserState, TTempState}"/>.
    /// </summary>
    /// <typeparam name="TConversationState">Optional. Type of the conversation state object being persisted.</typeparam>
    /// <typeparam name="TUserState">Optional. Type of the user state object being persisted.</typeparam>
    /// <typeparam name="TTempState">Optional. Type of the temp state object being persisted.</typeparam>
    public class TurnState<TConversationState, TUserState, TTempState> : StateBase, ITurnState<TConversationState, TUserState, TTempState>
        where TConversationState : StateBase
        where TUserState : StateBase
        where TTempState : TempState
    {
        /// <summary>
        /// Name of the conversation state entry.
        /// </summary>
        public const string ConversationStateKey = "conversationState";

        /// <summary>
        /// Name of the user state entry.
        /// </summary>
        public const string UserStateKey = "userState";

        /// <summary>
        /// Name of the temp state entry.
        /// </summary>
        public const string TempStateKey = "tempState";

        /// <summary>
        /// Stores all the conversation-related state entry.
        /// </summary>
        public TurnStateEntry<TConversationState>? ConversationStateEntry
        {
            get
            {
                return Get<TurnStateEntry<TConversationState>>(ConversationStateKey);
            }
            set
            {
                Verify.ParamNotNull(value);

                Set(ConversationStateKey, value!);
            }
        }

        /// <summary>
        /// Stores all the user related state entry.
        /// </summary>
        public TurnStateEntry<TUserState>? UserStateEntry
        {
            get
            {
                return Get<TurnStateEntry<TUserState>>(UserStateKey);
            }
            set
            {
                Verify.ParamNotNull(value);

                Set(UserStateKey, value!);
            }
        }

        /// <summary>
        /// Stores all the temporary state entry for the current turn.
        /// </summary>
        public TurnStateEntry<TTempState>? TempStateEntry
        {
            get
            {
                return Get<TurnStateEntry<TTempState>>(TempStateKey);
            }
            set
            {
                Verify.ParamNotNull(value);

                Set(TempStateKey, value!);
            }
        }

        /// <summary>
        /// Stores all the conversation-related state.
        /// </summary>
        public TConversationState? Conversation
        {
            get
            {
                return ConversationStateEntry?.Value;
            }
        }

        /// <summary>
        /// Stores all the user related state.
        /// </summary>
        public TUserState? User
        {
            get
            {
                return UserStateEntry?.Value;
            }
        }

        /// <summary>
        /// Stores the current turn's state.
        /// </summary>
        public TTempState? Temp
        {
            get
            {
                return TempStateEntry?.Value;
            }
        }
    }

    /// <summary>
    /// Defines the default state scopes persisted by the <see cref="TurnStateManager"/>.
    /// </summary>
    public class TurnState : TurnState<StateBase, StateBase, TempState> { }

}
