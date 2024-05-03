using System.ClientModel.Primitives;
using System.Text.Json.Serialization;
using Azure.AI.OpenAI.Assistants;

namespace Microsoft.Teams.AI.AI.OpenAI.Models
{
    internal class Thread
    {
        [JsonPropertyName("id")]
        public string Id { get; set; } = string.Empty;

        [JsonPropertyName("created_at")]
        public long CreatedAt { get; set; }

        [JsonPropertyName("metadata")]
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public IReadOnlyDictionary<string, string>? Metadata { get; set; }

        [JsonPropertyName("object")]
        public string Object { get; } = "thread";

        public AssistantThread ToAssistantThread()
        {
            return ModelReaderWriter.Read<AssistantThread>(BinaryData.FromObjectAsJson(this))!;
        }
    }

    internal class ThreadCreateParams
    {
        [JsonPropertyName("messages")]
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public List<MessageCreateParams>? Messages { get; set; }

        [JsonPropertyName("metadata")]
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public IReadOnlyDictionary<string, string>? Metadata { get; set; }

        public AssistantThreadCreationOptions ToAssistantThreadCreationOptions()
        {
            return ModelReaderWriter.Read<AssistantThreadCreationOptions>(BinaryData.FromObjectAsJson(this))!;
        }
    }
}
