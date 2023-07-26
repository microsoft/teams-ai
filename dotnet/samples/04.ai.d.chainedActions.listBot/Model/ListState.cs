using Microsoft.TeamsAI.State;

namespace ListBot.Model
{
    public class ListState : TurnState<ConversationState, StateBase, TempState> { }

    public class ConversationState : StateBase
    {
        private const string _greetedKey = "greetedKey";
        private const string _listNamesKey = "listNamesKey";
        private const string _listsKey = "listsKey";

        public bool Greeted
        {
            get => Get<bool>(_greetedKey);
            set => Set(_greetedKey, value);
        }

        public IList<string>? ListNames
        {
            get => Get<IList<string>>(_listNamesKey);
            set => Set(_listNamesKey, value);
        }

        public Dictionary<string, IList<string>>? Lists
        {
            get => Get<Dictionary<string, IList<string>>>(_listsKey);
            set => Set(_listsKey, value);
        }
    }
}
