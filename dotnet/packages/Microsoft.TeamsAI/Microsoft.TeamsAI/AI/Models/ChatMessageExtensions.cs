using Azure.AI.OpenAI;
using Microsoft.Teams.AI.Exceptions;
using Microsoft.Teams.AI.Utilities;

namespace Microsoft.Teams.AI.AI.Models
{
    /// <summary>
    /// Provides extension methods for the <see cref="ChatMessage"/> class.
    /// </summary>
    internal static class ChatMessageExtensions
    {
        /// <summary>
        /// Converts a <see cref="ChatMessage"/> to an <see cref="ChatRequestMessage"/>.
        /// </summary>
        /// <param name="chatMessage">The original <see cref="ChatMessage" />.</param>
        /// <returns>An <see cref="ChatRequestMessage"/>.</returns>
        public static ChatRequestMessage ToChatRequestMessage(this ChatMessage chatMessage)
        {
            Verify.NotNull(chatMessage.Content);
            Verify.NotNull(chatMessage.Name);
            Verify.NotNull(chatMessage.Role);
            Verify.NotNull(chatMessage.ToolCallId);

            ChatRole role = chatMessage.Role;
            ChatRequestMessage? message = null;

            if (role == ChatRole.User)
            {
                ChatRequestUserMessage userMessage = new(chatMessage.Content);

                if (chatMessage.Name != string.Empty)
                {
                    userMessage.Name = chatMessage.Name;
                }

                message = userMessage;
            }

            if (role == ChatRole.Assistant)
            {
                ChatRequestAssistantMessage assistantMessage = new(chatMessage.Content);

                if (chatMessage.FunctionCall != null)
                {
                    assistantMessage.FunctionCall = new(chatMessage.FunctionCall.Name ?? "", chatMessage.FunctionCall.Arguments ?? "");
                }

                if (chatMessage.ToolCalls != null)
                {
                    foreach (ChatCompletionsToolCall toolCall in chatMessage.ToolCalls)
                    {
                        assistantMessage.ToolCalls.Add(toolCall.ToAzureSdkChatCompletionsToolCall());
                    }
                }

                if (chatMessage.Name != string.Empty)
                {
                    assistantMessage.Name = chatMessage.Name;
                }

                message = assistantMessage;
            }

            if (role == ChatRole.System)
            {
                ChatRequestSystemMessage systemMessage = new(chatMessage.Content);

                if (chatMessage.Name != string.Empty)
                {
                    systemMessage.Name = chatMessage.Name;
                }

                message = systemMessage;
            }

            if (role == ChatRole.Function)
            {
                message = new ChatRequestFunctionMessage(chatMessage.Name, chatMessage.Content);
            }

            if (role == ChatRole.Tool)
            {
                message = new ChatRequestToolMessage(chatMessage.Content, chatMessage.ToolCallId);
            }

            if (message == null)
            {
                throw new TeamsAIException($"Invalid chat message role: {role}");
            }

            return message;
        }

        public static Azure.AI.OpenAI.ChatCompletionsToolCall ToAzureSdkChatCompletionsToolCall(this ChatCompletionsToolCall toolCall)
        {
            if (toolCall.Type == ToolType.Function)
            {
                ChatCompletionsFunctionToolCall functionToolCall = (ChatCompletionsFunctionToolCall)toolCall;
                return new Azure.AI.OpenAI.ChatCompletionsFunctionToolCall(functionToolCall.Id, functionToolCall.Name, functionToolCall.Arguments);
            }

            throw new TeamsAIException($"Invalid tool type: {toolCall.Type}");
        }
    }
}
