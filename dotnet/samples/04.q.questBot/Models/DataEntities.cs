using System.Text.Json.Serialization;

namespace QuestBot.Models
{
    public class DataEntities
    {
        [JsonPropertyName("operation")]
        public string? Operation { get; set; }

        [JsonPropertyName("description")]
        public string? Description { get; set; }

        [JsonPropertyName("items")]
        public string? Items { get; set; }

        [JsonPropertyName("title")]
        public string? Title { get; set; }

        [JsonPropertyName("name")]
        public string? Name { get; set; }

        [JsonPropertyName("backstory")]
        public string? Backstory { get; set; }

        [JsonPropertyName("equipped")]
        public string? Equipped { get; set; }

        [JsonPropertyName("until")]
        public string? Until { get; set; }

        [JsonPropertyName("days")]
        public string? Days { get; set; }
    }
}
