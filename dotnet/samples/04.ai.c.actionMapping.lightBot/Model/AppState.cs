using Microsoft.Teams.AI.State;

namespace LightBot.Model
{
    // Extend the turn state by configuring custom strongly typed state classes.
    public class AppState : TurnState<ConversationState, StateBase, TempState>
    {
    }

    // This class adds custom properties to the turn state which will be accessible in the various handler methods.
    public class ConversationState : StateBase
    {
        private const string _lightsOnKey = "_lightsOnKey";

        public bool LightsOn
        {
            get => Get<bool>(_lightsOnKey);
            set => Set(_lightsOnKey, value);
        }
    }
}
