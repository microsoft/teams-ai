using System.Text.Json.Serialization;

namespace Microsoft.Teams.AI.AI.OpenAI.Models
{
    internal class ThreadMessage
    {
        [JsonPropertyName("id")]
        public string Id { get; set; } = string.Empty;

        [JsonPropertyName("assistant_id")]
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public string? AssistantId { get; set; }

        [JsonPropertyName("content")]
        public List<MessageContent> Content { get; set; } = new List<MessageContent>();

        [JsonPropertyName("created_at")]
        public long CreatedAt { get; set; }

        [JsonPropertyName("file_ids")]
        public List<string> FileIds { get; set; } = new List<string>();

        [JsonPropertyName("metadata")]
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public Dictionary<string, object>? Metadata { get; set; }

        [JsonPropertyName("object")]
        public string Object { get; } = "thread.message";

        [JsonPropertyName("role")]
        public string Role { get; set; } = string.Empty;

        [JsonPropertyName("run_id")]
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public string? RunId { get; set; }

        [JsonPropertyName("thread_id")]
        public string ThreadId { get; set; } = string.Empty;
    }
}
