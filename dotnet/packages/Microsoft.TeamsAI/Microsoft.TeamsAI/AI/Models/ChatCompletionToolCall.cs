using Microsoft.Teams.AI.Utilities;

namespace Microsoft.Teams.AI.AI.Models
{
    /// <summary>
    /// Abstract class representing a tool call in OpenAI's Chat Completion API.
    /// </summary>
    public abstract class ChatCompletionsToolCall
    {
        /// <summary>
        /// Type of tool.
        /// </summary>
        public string Type { get; }

        /// <summary>
        /// Id of the tool call.
        /// </summary>
        public string Id { get; set; }

        /// <summary>
        /// Initializes a new instance of the <see cref="ChatCompletionsToolCall"/> class.
        /// </summary>
        /// <param name="type">The type of the tool.</param>
        /// <param name="id">Id of the tool call.</param>
        internal ChatCompletionsToolCall(string type, string id)
        {
            Verify.ParamNotNull(type);
            Verify.ParamNotNull(id);

            Type = type;
            Id = id;
        }
    }

    /// <summary>
    /// OpenAI tool type.
    /// </summary>
    public static class ToolType
    {
        /// <summary>
        /// Functions tool type.
        /// </summary>
        public static readonly string Function = "function";
    }
}
