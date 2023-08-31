using Microsoft.TeamsAI.State;

namespace QuestBot.State
{
    public class QuestUserState : StateBase
    {
        private const string _nameKey = "nameKey";
        private const string _backstoryKey = "backstoryKey";
        private const string _equippedKey = "equippedKey";
        private const string _inventoryKey = "inventoryKey";

        public static readonly string DEFAULT_BACKSTORY = "Lives in Shadow Falls.";
        public static readonly string DEFAULT_EQUIPPED = "Wearing clothes.";

        public string? Name
        {
            get => Get<string>(_nameKey);
            set => Set(_nameKey, value);
        }

        public string? Backstory
        {
            get => Get<string>(_backstoryKey);
            set => Set(_backstoryKey, value);
        }

        public string? Equipped
        {
            get => Get<string>(_equippedKey);
            set => Set(_equippedKey, value);
        }

        public IReadOnlyDictionary<string, int>? Inventory
        {
            get => Get<IReadOnlyDictionary<string, int>>(_inventoryKey);
            set => Set(_inventoryKey, value);
        }
    }
}
