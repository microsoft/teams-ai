using System.Text.Json.Serialization;

namespace QuestBot.Models
{
    public class Location
    {
        [JsonPropertyName("title")]
        public string Title { get; set; } = string.Empty;

        [JsonPropertyName("description")]
        public string Description { get; set; } = string.Empty;

        [JsonPropertyName("encounterChance")]
        public double EncounterChance { get; set; }
    }
}
