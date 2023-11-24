using System.Text.Json.Serialization;

namespace OrderBot.Models
{
    public class Pizza
    {
        [JsonPropertyName("itemType")]
        public string ItemType { get; } = "pizza";

        [JsonPropertyName("size")]
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public string? Size { get; set; }

        [JsonPropertyName("addedToppings")]
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public string[]? AddedToppings { get; set; }

        [JsonPropertyName("removedToppings")]
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public string[]? RemovedToppings { get; set; }

        [JsonPropertyName("quantity")]
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public int? Quantity { get; set; }

        [JsonPropertyName("name")]
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public string? Name { get; set; }
    }

    public class Beer
    {
        [JsonPropertyName("itemType")]
        public string ItemType { get; } = "beer";

        [JsonPropertyName("kind")]
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public string Kind { get; set; } = string.Empty;

        [JsonPropertyName("quantity")]
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public int? Quantity { get; set; }
    }

    public class Salad
    {
        [JsonPropertyName("itemType")]
        public string ItemType { get; } = "salad";

        [JsonPropertyName("portion")]
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public string? Portion { get; set; }

        [JsonPropertyName("style")]
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public string? Style { get; set; }

        [JsonPropertyName("addedIngredients")]
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public string[]? AddedIngredients { get; set; }

        [JsonPropertyName("removedIngredients")]
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public string[]? RemovedIngredients { get; set; }

        [JsonPropertyName("quantity")]
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public int? Quantity { get; set; }
    }

    public class Unknown
    {
        [JsonPropertyName("itemType")]
        public string ItemType { get; } = "unknown";

        [JsonPropertyName("item")]
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public string Item { get; set; } = string.Empty;
    }
}
