using Microsoft.Teams.AI.State;

namespace DevOpsBot.Model
{
    /// <summary>
    /// Extend the turn state by configuring custom strongly typed state classes.
    /// </summary>
    public class DevOpsState : TurnState<DevOpsConversationState, StateBase, TempState>
    {
    }

    /// <summary>
    /// This class adds custom properties to the conversation state which will be accessible in the activity handler methods.
    /// </summary>
    public class DevOpsConversationState : StateBase
    {
        private const string _greetedKey = "greetedKey";
        private const string _workItemsKey = "workItemsKey";

        public bool Greeted
        {
            get => Get<bool>(_greetedKey);
            set => Set(_greetedKey, value);
        }

        public EntityData[] WorkItems
        {
            get => Get<EntityData[]>(_workItemsKey) ?? Array.Empty<EntityData>();
            set => Set(_workItemsKey, value);
        }
    }
}
