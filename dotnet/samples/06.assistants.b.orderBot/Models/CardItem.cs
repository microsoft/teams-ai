using System.Text.Json.Serialization;

namespace OrderBot.Models
{
    public class CardItem
    {
        [JsonPropertyName("type")]
        public string Type { get; } = "TextBlock";

        [JsonPropertyName("text")]
        public string Text { get; set; } = string.Empty;

        [JsonPropertyName("weight")]
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public string? Weight { get; set; }

        [JsonPropertyName("wrap")]
        public bool Wrap { get; } = true;

        [JsonPropertyName("color")]
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public string? Color { get; set; }
    }
}
