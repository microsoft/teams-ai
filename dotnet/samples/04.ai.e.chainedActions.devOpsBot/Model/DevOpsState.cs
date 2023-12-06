using Microsoft.Teams.AI.State;

namespace DevOpsBot.Model
{
    /// <summary>
    /// Extend the turn state by configuring custom strongly typed state classes.
    /// </summary>
    public class DevOpsState : TurnState
    {
        public DevOpsState()
        {
            ScopeDefaults[CONVERSATION_SCOPE] = new DevOpsConversationState();
        }

        /// <summary>
        /// Stores all the conversation-related state.
        /// </summary>
        public new DevOpsConversationState Conversation
        {
            get
            {
                TurnStateEntry? scope = GetScope(CONVERSATION_SCOPE);

                if (scope == null)
                {
                    throw new ArgumentException("TurnState hasn't been loaded. Call LoadStateAsync() first.");
                }

                return (DevOpsConversationState)scope.Value!;
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
    }

    /// <summary>
    /// This class adds custom properties to the conversation state which will be accessible in the activity handler methods.
    /// </summary>
    public class DevOpsConversationState : Record
    {
        private const string _greetedKey = "greeted";
        private const string _nextIdKey = "nextId";
        private const string _workItemsKey = "workItems";
        private const string _membersKey = "members";

        public bool Greeted
        {
            get => Get<bool>(_greetedKey);
            set => Set(_greetedKey, value);
        }

        public int NextId
        {
            get => Get<int>(_nextIdKey);
            set => Set(_nextIdKey, value);
        }

        public WorkItem[] WorkItems
        {
            get => Get<WorkItem[]>(_workItemsKey) ?? Array.Empty<WorkItem>();
            set => Set(_workItemsKey, value);
        }

        public string[] Members
        {
            get => Get<string[]>(_membersKey) ?? Array.Empty<string>();
            set => Set(_membersKey, value);
        }
    }
}
