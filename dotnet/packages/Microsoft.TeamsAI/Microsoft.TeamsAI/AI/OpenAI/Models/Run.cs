using System.Text.Json.Serialization;

namespace Microsoft.Teams.AI.AI.OpenAI.Models
{
    internal class Run
    {
        [JsonPropertyName("id")]
        public string Id { get; set; } = string.Empty;

        [JsonPropertyName("assistant_id")]
        public string AssistantId { get; set; } = string.Empty;

        [JsonPropertyName("cancelled_at")]
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public long? CancelledAt { get; set; }

        [JsonPropertyName("completed_at")]
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public long? CompletedAt { get; set; }

        [JsonPropertyName("created_at")]
        public long CreatedAt { get; set; }

        [JsonPropertyName("expires_at")]
        public long ExpiredAt { get; set; }

        [JsonPropertyName("failed_at")]
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public long? FailedAt { get; set; }

        [JsonPropertyName("file_ids")]
        public List<string> FileIds { get; set; } = new List<string>();

        [JsonPropertyName("instructions")]
        public string Instructions { get; set; } = string.Empty;

        [JsonPropertyName("last_error")]
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public LastError? LastError { get; set; }

        [JsonPropertyName("metadata")]
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public Dictionary<string, object>? Metadata { get; set; }

        [JsonPropertyName("model")]
        public string Model { get; set; } = string.Empty;

        [JsonPropertyName("object")]
        public string Object { get; } = "thread.run";

        [JsonPropertyName("required_action")]
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public RequiredAction? RequiredAction { get; set; }

        [JsonPropertyName("started_at")]
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public long? StartedAt { get; set; }

        [JsonPropertyName("status")]
        public string Status { get; set; } = string.Empty;

        [JsonPropertyName("thread_id")]
        public string ThreadId { get; set; } = string.Empty;

        [JsonPropertyName("tools")]
        public List<Tool> Tools { get; set; } = new List<Tool>();
    }

    internal class LastError
    {
        [JsonPropertyName("code")]
        public string Code { get; set; } = string.Empty;

        [JsonPropertyName("message")]
        public string Message { get; set; } = string.Empty;
    }

    internal class RequiredAction
    {
        [JsonPropertyName("submit_tool_outputs")]
        public SubmitToolOutputs SubmitToolOutputs { get; set; } = new();

        [JsonPropertyName("type")]
        public string Type { get; } = "submit_tool_outputs";
    }

    internal class SubmitToolOutputs
    {
        [JsonPropertyName("tool_calls")]
        public List<ToolCall> ToolCalls { get; set; } = new List<ToolCall>();
    }

    internal class ToolCall
    {
        [JsonPropertyName("id")]
        public string Id { get; set; } = string.Empty;

        [JsonPropertyName("function")]
        public ToolCallFunction Function { get; set; } = new();

        [JsonPropertyName("type")]
        public string Type { get; } = "function";
    }

    internal class ToolCallFunction
    {
        [JsonPropertyName("arguments")]
        public string Arguments { get; set; } = string.Empty;

        [JsonPropertyName("name")]
        public string Name { get; set; } = string.Empty;
    }

    internal class RunCreateParams
    {
        [JsonPropertyName("assistant_id")]
        public string AssistantId { get; set; } = string.Empty;

        [JsonPropertyName("instructions")]
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public string? Instructions { get; set; }

        [JsonPropertyName("metadata")]
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public Dictionary<string, object>? Metadata { get; set; }

        [JsonPropertyName("model")]
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public string? Model { get; set; }

        [JsonPropertyName("tools")]
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public List<Tool>? Tools { get; set; }
    }

    internal class SubmitToolOutputsParams
    {
        [JsonPropertyName("tool_outputs")]
        public List<ToolOutput> ToolOutputs { get; set; } = new List<ToolOutput>();
    }

    internal class ToolOutput
    {
        [JsonPropertyName("output")]
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public string? Output { get; set; }

        [JsonPropertyName("tool_call_id")]
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public string? ToolCallId { get; set; }
    }
}
