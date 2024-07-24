using Microsoft.Teams.AI.Exceptions;
using Microsoft.Teams.AI.Utilities;
using OpenAI.Chat;

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

        /// <summary>
        /// Maps to OpenAI.Chat.ChatToolCall
        /// </summary>
        /// <returns>The mapped OpenAI.Chat.ChatToolCall object.</returns>
        /// <exception cref="TeamsAIException">If the tool call type is not valid.</exception>
        internal ChatToolCall ToChatToolCall()
        {
            if (this.Type == ToolType.Function)
            {
                ChatCompletionsFunctionToolCall functionToolCall = (ChatCompletionsFunctionToolCall)this;
                return ChatToolCall.CreateFunctionToolCall(functionToolCall.Id, functionToolCall.Name, functionToolCall.Arguments);
            }

            throw new TeamsAIException($"Invalid tool type: {this.Type}");
        }

        /// <summary>
        /// Maps OpenAI.Chat.ChatToolCall to ChatCompletionsToolCall
        /// </summary>
        /// <param name="toolCall">The tool call.</param>
        /// <returns>The mapped ChatCompletionsToolCall object</returns>
        /// <exception cref="TeamsAIException">If the tool call type is not valid.</exception>
        internal static ChatCompletionsToolCall FromChatToolCall(ChatToolCall toolCall)
        {
            if (toolCall.Kind == ChatToolCallKind.Function)
            {
                return new ChatCompletionsFunctionToolCall(toolCall.Id, toolCall.FunctionName, toolCall.FunctionArguments);
            }

            throw new TeamsAIException($"Invalid ChatCompletionsToolCall type: {toolCall.GetType().Name}");
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
