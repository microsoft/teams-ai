﻿using System.Text.Json.Serialization;

namespace Microsoft.Teams.AI.AI.OpenAI.Models
{
    internal class Assistant
    {
        [JsonPropertyName("id")]
        public string Id { get; set; } = string.Empty;

        [JsonPropertyName("created_at")]
        public long CreatedAt { get; set; }

        [JsonPropertyName("description")]
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public string? Description { get; set; }

        [JsonPropertyName("file_ids")]
        public List<string> FileIds { get; set; } = new List<string>();

        [JsonPropertyName("instructions")]
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public string? Instructions { get; set; }

        [JsonPropertyName("metadata")]
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public Dictionary<string, object>? Metadata { get; set; }

        [JsonPropertyName("model")]
        public string Model { get; set; } = string.Empty;

        [JsonPropertyName("name")]
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public string? Name { get; set; }

        [JsonPropertyName("object")]
        public string Object { get; } = "assistant";

        [JsonPropertyName("tools")]
        public List<Tool> Tools { get; set; } = new List<Tool>();
    }

    internal class AssistantCreateParams
    {
        [JsonPropertyName("model")]
        public string Model { get; set; } = string.Empty;

        [JsonPropertyName("description")]
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public string? Description { get; set; }

        [JsonPropertyName("file_ids")]
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public List<string>? FileIds { get; set; }

        [JsonPropertyName("instructions")]
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public string? Instructions { get; set; }

        [JsonPropertyName("metadata")]
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public Dictionary<string, object>? Metadata { get; set; }

        [JsonPropertyName("name")]
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public string? Name { get; set; }

        [JsonPropertyName("tools")]
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public List<Tool>? Tools { get; set; }
    }
}
