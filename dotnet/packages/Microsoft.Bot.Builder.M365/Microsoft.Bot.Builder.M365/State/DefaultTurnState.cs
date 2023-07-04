using Microsoft.Bot.Builder.M365.Utilities;

namespace Microsoft.Bot.Builder.M365.State
{
    /// <summary>
    /// Defines the default state scopes persisted by the `DefaultTurnStateManager`.
    /// </summary>
    /// <typeparam name="TConversationState">Optional. Type of the conversation state object being persisted.</typeparam>
    /// <typeparam name="TUserState">Optional. Type of the user state object being persisted.</typeparam>
    /// <typeparam name="TTempState">Optional. Type of the temp state object being persisted.</typeparam>
    public class DefaultTurnState<TConversationState, TUserState, TTempState> : TurnState
        where TConversationState : Dictionary<string, object>
        where TUserState : Dictionary<string, object>
        where TTempState : TempState
    {
        public const string ConversationStateKey = "conversationState";
        public const string UserStateKey = "userState";
        public const string TempStateKey = "tempState";

        public TurnStateEntry<TConversationState>? ConversationState
        {
            get
            {
                return Get<TConversationState>(ConversationStateKey);
            }
            set
            {
                Verify.ParamNotNull(value, nameof(value));

                _Set(ConversationStateKey, value!);
            }
        }
        public TurnStateEntry<TUserState>? UserState
        {
            get
            {
                return Get<TUserState>(UserStateKey);
            }
            set
            {
                Verify.ParamNotNull(value, nameof(value));

                _Set(UserStateKey, value!);
            }
        }
        public TurnStateEntry<TTempState>? TempState
        {
            get
            {
                return Get<TTempState>(TempStateKey);
            }
            set
            {
                Verify.ParamNotNull(value, nameof(value));

                _Set(TempStateKey, value!);
            }
        }

        private void _Set<T>(string key, TurnStateEntry<T> value) where T : class
        {
            Verify.ParamNotNull(value, nameof(value));
            TurnStateEntry<object> castedValue = value!.CastValue<object>() ?? throw new InvalidCastException($"Cannot cast {nameof(value)} to {nameof(TurnStateEntry<object>)}");
            this[key] = castedValue;
        }
    }

    public class DefaultTurnState : DefaultTurnState<Dictionary<string, object>, Dictionary<string, object>, TempState> { }

}