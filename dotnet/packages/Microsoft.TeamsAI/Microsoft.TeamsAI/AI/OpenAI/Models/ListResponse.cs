using System.Text.Json.Serialization;

namespace Microsoft.Teams.AI.AI.OpenAI.Models
{
    internal class ListResponse<T> where T : new()
    {
        [JsonPropertyName("data")]
        public List<T> Data { get; set; } = new List<T>();

        [JsonPropertyName("first_id")]
        public string FirstId { get; set; } = string.Empty;

        [JsonPropertyName("last_id")]
        public string LastId { get; set; } = string.Empty;

        [JsonPropertyName("has_more")]
        public bool HasMore { get; set; }
    }
}
