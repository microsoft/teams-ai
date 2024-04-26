using System.Text.Json.Serialization;

namespace Microsoft.Teams.AI.AI.OpenAI.Models
{
    /// <summary>
    /// Model represents OpenAI Assistant
    /// </summary>
    [Obsolete("This class has been replaced with `Azure.AI.OpenAI.Assistants.Assistant`")]
    public class Assistant
    {
        /// <summary>
        /// Assistant ID.
        /// </summary>
        [JsonPropertyName("id")]
        public string Id { get; set; } = string.Empty;

        /// <summary>
        /// The Unix timestamp (in seconds) for when the assistant was created.
        /// </summary>
        [JsonPropertyName("created_at")]
        public long CreatedAt { get; set; }

        /// <summary>
        /// Assistant description.
        /// </summary>
        [JsonPropertyName("description")]
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public string? Description { get; set; }

        /// <summary>
        /// A list of file IDs attached to this assistant.
        /// </summary>
        [JsonPropertyName("file_ids")]
        public List<string> FileIds { get; set; } = new List<string>();

        /// <summary>
        /// The system instructions that the assistant uses.
        /// </summary>
        [JsonPropertyName("instructions")]
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public string? Instructions { get; set; }

        /// <summary>
        /// Assistant additional information.
        /// </summary>
        [JsonPropertyName("metadata")]
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public Dictionary<string, object>? Metadata { get; set; }

        /// <summary>
        /// ID of the model to use.
        /// </summary>
        [JsonPropertyName("model")]
        public string Model { get; set; } = string.Empty;

        /// <summary>
        /// Assistant name.
        /// </summary>
        [JsonPropertyName("name")]
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public string? Name { get; set; }

        /// <summary>
        /// The object type, which is always "assistant".
        /// </summary>
        [JsonPropertyName("object")]
        public string Object { get; } = "assistant";

        /// <summary>
        /// A list of tool enabled on the assistant.
        /// </summary>
        [JsonPropertyName("tools")]
        public List<Tool> Tools { get; set; } = new List<Tool>();
    }

    /// <summary>
    /// Model represents parameters to create an Assistant.
    /// </summary>
    [Obsolete("This class has been replaced with `Azure.AI.OpenAI.Assistants.AssistantCreationOptions`")]
    public class AssistantCreateParams
    {
        /// <summary>
        /// ID of the model to use.
        /// </summary>
        [JsonPropertyName("model")]
        public string Model { get; set; } = string.Empty;

        /// <summary>
        /// Assistant description.
        /// </summary>
        [JsonPropertyName("description")]
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public string? Description { get; set; }

        /// <summary>
        /// A list of file IDs attached to this assistant.
        /// </summary>
        [JsonPropertyName("file_ids")]
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public List<string>? FileIds { get; set; }

        /// <summary>
        /// The system instructions that the assistant uses.
        /// </summary>
        [JsonPropertyName("instructions")]
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public string? Instructions { get; set; }

        /// <summary>
        /// Assistant additional information.
        /// </summary>
        [JsonPropertyName("metadata")]
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public Dictionary<string, object>? Metadata { get; set; }

        /// <summary>
        /// Assistant name.
        /// </summary>
        [JsonPropertyName("name")]
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public string? Name { get; set; }

        /// <summary>
        /// A list of tool enabled on the assistant.
        /// </summary>
        [JsonPropertyName("tools")]
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public List<Tool>? Tools { get; set; }
    }
}
