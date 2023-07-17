using Microsoft.TeamsAI.State;

namespace EchoBot.Model
{
    // Extend the turn state by configuring custom strongly typed state classes.
    public class AppState : TurnState<ConversationState, StateBase, TempState>
    {
    }

    // This class adds custom properties to the turn state which will be accessible in the activity handler methods.
    public class ConversationState : StateBase
    {
        private const string _countKey = "countKey";

        public int MessageCount
        {
            get => Get<int>(_countKey);
            set => Set(_countKey, value);
        }
    }
}
