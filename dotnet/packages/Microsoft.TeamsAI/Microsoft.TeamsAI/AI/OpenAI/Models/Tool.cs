using System.Text.Json.Serialization;

namespace Microsoft.Teams.AI.AI.OpenAI.Models
{
    /// <summary>
    /// Model represents Assistant tool.
    /// </summary>
    [Obsolete("This type has been depecrated. Use Azure.AI.OpenAI.Assistants.ToolOutput instead.")]
    public class Tool
    {
        /// <summary>
        /// The type of Code Interpreter tool.
        /// </summary>
        public const string CODE_INTERPRETER_TYPE = "code_interpreter";

        /// <summary>
        /// The type of Function Calling tool.
        /// </summary>
        public const string FUNCTION_CALLING_TYPE = "function";

        /// <summary>
        /// Type of tool.
        /// </summary>
        [JsonPropertyName("type")]
        public string Type { get; set; } = string.Empty;

        /// <summary>
        /// For function tool, the function details.
        /// </summary>
        [JsonPropertyName("function")]
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public Function? Function { get; set; }
    }

    /// <summary>
    /// Model represent function of Assistant tool.
    /// </summary>
    [Obsolete("This type has been depecrated. Use Azure.AI.OpenAI.Assistants.RequiredFunctionToolCall instead.")]
    public class Function
    {
        /// <summary>
        /// Function name.
        /// </summary>
        [JsonPropertyName("name")]
        public string Name { get; set; } = string.Empty;

        /// <summary>
        /// The parameters the functions accepts, described as a JSON Schema object.
        /// </summary>
        [JsonPropertyName("parameters")]
        public Dictionary<string, object> Parameters { get; set; } = new Dictionary<string, object>();

        /// <summary>
        /// Function description.
        /// </summary>
        [JsonPropertyName("description")]
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public string? Description { get; set; }
    }
}
