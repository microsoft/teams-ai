using System.Text.Json.Serialization;

namespace DevOpsBot.Model
{
    /// <summary>
    /// The strongly typed user update parameter data
    /// </summary>
    public class UserUpdate
    {
        [JsonPropertyName("added")]
        public string[]? Added { get; set; } = Array.Empty<string>();

        [JsonPropertyName("removed")]
        public string[]? Removed { get; set; } = Array.Empty<string>();
    }
}
