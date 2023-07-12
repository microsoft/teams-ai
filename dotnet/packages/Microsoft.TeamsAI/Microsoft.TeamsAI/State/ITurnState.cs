
namespace Microsoft.TeamsAI.State
{
    public interface ITurnState<out TConversationState, out TUserState, out TTempState>
        where TConversationState : class
        where TUserState : class
        where TTempState : TempState
    {
        public TConversationState? Conversation { get; }

        public TUserState? User { get; }

        public TTempState? Temp{ get; }
    }
}
