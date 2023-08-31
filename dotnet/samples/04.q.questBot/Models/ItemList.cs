namespace QuestBot.Models
{
    public class ItemList : Dictionary<string, int>
    {
        public ItemList() : base(StringComparer.OrdinalIgnoreCase) { }
        public ItemList(IEnumerable<KeyValuePair<string, int>> collection) : base(collection, StringComparer.OrdinalIgnoreCase) { }

        public void AddItem(string key, int value)
        {
            if (ContainsKey(key))
            {
                this[key] += value;
            }
            else
            {
                this[key] = value;
            }
        }

        public string SearchItem(string item)
        {
            if (ContainsKey(item))
            {
                return item;
            }

            var bestMatch = string.Empty;
            foreach (var kv in this)
            {
                if (kv.Key.IndexOf(item, StringComparison.OrdinalIgnoreCase) >= 0)
                {
                    if (string.IsNullOrEmpty(bestMatch) || kv.Key.Length < bestMatch.Length)
                    {
                        bestMatch = kv.Key;
                    }
                }
            }
            return bestMatch;
        }

        public ItemList NormalizeItems()
        {
            var normalized = new ItemList();
            foreach (var kv in this)
            {
                var normalizedKv = MapTo(kv.Key, kv.Value);
                if (normalized.ContainsKey(normalizedKv.Key))
                {
                    normalized[normalizedKv.Key] += normalizedKv.Value;
                }
                else
                {
                    normalized[normalizedKv.Key] = normalizedKv.Value;
                }
            }

            return normalized;
        }

        public static ItemList FromText(string? text)
        {
            var itemList = new ItemList();

            // Parse text
            text = text?.Trim()?.ToLowerInvariant();
            if (!string.IsNullOrEmpty(text))
            {
                var name = string.Empty;
                var parts = text.Replace('\n', ',').Split(',');
                foreach (var entry in parts)
                {
                    var pos = entry.IndexOf(':');
                    if (pos >= 0)
                    {
                        // Add item to list
                        name += entry.Substring(0, pos);
                        int.TryParse(entry.Substring(pos + 1), out var count);
                        count = count < 0 ? 0 : count;
                        itemList.AddItem(name, count);

                        //Next item
                        name = string.Empty;
                    }
                    else
                    {
                        // Append to current name
                        name += $",{entry}";
                    }
                }

                // Add dangling item
                if (!string.IsNullOrEmpty(name))
                {
                    itemList.AddItem(name, 0);
                }
            }

            return itemList;
        }

        public static KeyValuePair<string, int> MapTo(string name, int count)
        {
            name = name.Trim().ToLowerInvariant();
            switch (name)
            {
                case "coin":
                case "gold coins":
                case "wealth": return new KeyValuePair<string, int>("gold", count);
                case "coins":
                case "nuggets": return new KeyValuePair<string, int>("gold", count * 10);
                case "<item>":
                case "item":
                case "symbol":
                case "symbols":
                case "strange symbol":
                case "strange symbols":
                default: return new KeyValuePair<string, int>(string.Empty, 0);
            }

        }
    }
}
