using Microsoft.Bot.Builder;
using Microsoft.Teams.AI.State;
using Record = Microsoft.Teams.AI.State.Record;

namespace Microsoft.Teams.AI.Tests.TestUtils
{
    // Extend the turn state by configuring custom strongly typed state classes.
    internal sealed class CustomTurnState : TurnState
    {
        public CustomTurnState() : base()
        {
            ScopeDefaults[CONVERSATION_SCOPE] = new ConversationState();
        }

        /// <summary>
        /// Stores all the conversation-related state.
        /// </summary>
        public new ConversationState Conversation
        {
            get
            {
                TurnStateEntry? scope = GetScope(CONVERSATION_SCOPE);
                if (scope == null)
                {
                    throw new ArgumentException("TurnState hasn't been loaded. Call LoadStateAsync() first.");
                }

                return (ConversationState)scope.Value!;
            }
            set
            {
                TurnStateEntry? scope = GetScope(CONVERSATION_SCOPE);
                if (scope == null)
                {
                    throw new ArgumentException("TurnState hasn't been loaded. Call LoadStateAsync() first.");
                }

                scope.Replace(value!);
            }
        }

        public Dictionary<string, string> GetStorageKeys(ITurnContext turnContext)
        {
            return this.OnComputeStorageKeys(turnContext);
        }
    }

    // This class adds custom properties to the turn state which will be accessible in the activity handler methods.
    internal sealed class ConversationState : Record
    {
        private const string _countKey = "countKey";

        public int MessageCount
        {
            get => Get<int>(_countKey);
            set => Set(_countKey, value);
        }
    }
}
