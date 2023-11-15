using System.Text.Json.Serialization;

namespace Microsoft.Teams.AI.AI.OpenAI.Models
{
    internal class Tool
    {
        [JsonPropertyName("type")]
        public string Type { get; set; } = string.Empty;

        [JsonPropertyName("function")]
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public Function? Function { get; set; }
    }

    internal class Function
    {
        [JsonPropertyName("name")]
        public string Name { get; set; } = string.Empty;

        [JsonPropertyName("parameters")]
        public Dictionary<string, object> Parameters { get; set; } = new Dictionary<string, object>();

        [JsonPropertyName("description")]
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public string? Description { get; set; }
    }
}
