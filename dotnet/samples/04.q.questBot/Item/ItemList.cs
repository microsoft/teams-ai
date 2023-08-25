namespace QuestBot.Item
{
    public class ItemList : Dictionary<string, int>
    {
        public ItemList() : base(StringComparer.OrdinalIgnoreCase) { }
    }
}
