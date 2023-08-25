using System.Text.Json.Serialization;

namespace QuestBot.Models
{
    public class Quest
    {
        [JsonPropertyName("title")]
        public string Title { get; set; } = string.Empty;

        [JsonPropertyName("description")]
        public string Description { get; set; } = string.Empty;
    }
}
