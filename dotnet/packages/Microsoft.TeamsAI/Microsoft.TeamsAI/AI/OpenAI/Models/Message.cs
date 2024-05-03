using System.Text.Json.Serialization;

namespace Microsoft.Teams.AI.AI.OpenAI.Models
{
    internal class Message
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
        public IReadOnlyList<string> FileIds { get; set; } = new List<string>();

        [JsonPropertyName("metadata")]
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public IReadOnlyDictionary<string, string>? Metadata { get; set; }

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

    internal class MessageContent
    {
        [JsonPropertyName("type")]
        public string Type { get; set; } = string.Empty;

        [JsonPropertyName("text")]
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public MessageContentText? Text { get; set; }

        [JsonPropertyName("image_file")]
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public object? ImageFile { get; set; }
    }

    internal class MessageContentText
    {
        [JsonPropertyName("value")]
        public string Value { get; set; } = string.Empty;

        [JsonPropertyName("annotations")]
        public object? Annotations { get; set; }
    }

    internal class MessageCreateParams
    {
        [JsonPropertyName("content")]
        public string Content { get; set; } = string.Empty;

        [JsonPropertyName("role")]
        public string Role { get; } = "user";

        [JsonPropertyName("file_ids")]
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public List<string>? FileIds { get; set; }

        [JsonPropertyName("metadata")]
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public Dictionary<string, string>? Metadata { get; set; }
    }
}
