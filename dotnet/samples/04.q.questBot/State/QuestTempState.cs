using Microsoft.TeamsAI.State;

namespace QuestBot.State
{
    public class QuestTempState : TempState
    {
        private const string _playerAnsweredKey = "playerAnsweredKey";
        private const string _promptKey = "promptKey";
        private const string _promptInstructionsKey = "promptInstructionsKey";
        private const string _listItemsKey = "listItemsKey";
        private const string _listTypeKey = "listTypeKey";
        private const string _backstoryChangeKey = "backstoryChangeKey";
        private const string _equippedChangeKey = "equippedChangeKey";
        private const string _originalTextKey = "originalTextKey";
        private const string _newTextKey = "newTextKey";
        private const string _objectiveTitleKey = "objectiveTitleKey";

        public bool PlayerAnswered
        {
            get => Get<bool>(_playerAnsweredKey);
            set => Set(_playerAnsweredKey, value);
        }

        public string? Prompt
        {
            get => Get<string>(_promptKey);
            set => Set(_promptKey, value);
        }

        public string? PromptInstructions
        {
            get => Get<string>(_promptInstructionsKey);
            set => Set(_promptInstructionsKey, value);
        }

        public IReadOnlyDictionary<string, int>? ListItems
        {
            get => Get<IReadOnlyDictionary<string, int>>(_listItemsKey);
            set => Set(_listItemsKey, value);
        }

        public string? ListType
        {
            get => Get<string>(_listTypeKey);
            set => Set(_listTypeKey, value);
        }

        public string? BackstoryChange
        {
            get => Get<string>(_backstoryChangeKey);
            set => Set(_backstoryChangeKey, value);
        }

        public string? EquippedChange
        {
            get => Get<string>(_equippedChangeKey);
            set => Set(_equippedChangeKey, value);
        }

        public string? OriginalText
        {
            get => Get<string>(_originalTextKey);
            set => Set(_originalTextKey, value);
        }

        public string? NewText
        {
            get => Get<string>(_newTextKey);
            set => Set(_newTextKey, value);
        }

        public string? ObjectiveTitle
        {
            get => Get<string>(_objectiveTitleKey);
            set => Set(_objectiveTitleKey, value);
        }
    }
}
