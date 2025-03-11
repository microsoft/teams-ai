using Microsoft.SemanticKernel.ChatCompletion;
using Microsoft.Teams.AI.State;

namespace OSSDevOpsAgent.Model
{
    // Extend the turn state by configuring custom strongly typed state classes.
    public class AppState : TurnState
    {
        public AppState() : base()
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
                TurnStateEntry scope = GetScope(CONVERSATION_SCOPE);
                if (scope == null)
                {
                    throw new ArgumentException("TurnState hasn't been loaded. Call LoadStateAsync() first.");
                }

                return (ConversationState)scope.Value!;
            }
            set
            {
                TurnStateEntry scope = GetScope(CONVERSATION_SCOPE);
                if (scope == null)
                {
                    throw new ArgumentException("TurnState hasn't been loaded. Call LoadStateAsync() first.");
                }

                scope.Replace(value!);
            }
        }
    }

    // This class adds custom properties to the turn state which will be accessible in the activity handler methods.
    public class ConversationState : Record
    {
        private const string _kernelHistoryKey = "kernelHistory";

        public ChatHistory KernelHistory
        {
            get => Get<ChatHistory>(_kernelHistoryKey);
            set => Set(_kernelHistoryKey, value);
        }
    }
}
