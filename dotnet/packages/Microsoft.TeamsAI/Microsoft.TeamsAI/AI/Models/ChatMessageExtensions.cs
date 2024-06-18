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
            Verify.NotNull(chatMessage.Role);

            ChatRole role = chatMessage.Role;
            ChatRequestMessage? message = null;

            string? content = null;
            List<ChatMessageContentItem> contentItems = new();

            // Content is a text
            if (chatMessage.Content is string textContent)
            {
                content = textContent;
            }
            else if (chatMessage.Content is IEnumerable<MessageContentParts> contentParts)
            {
                // Content is has multiple possibly multi-modal parts.
                foreach (MessageContentParts contentPart in contentParts)
                {
                    if (contentPart is TextContentPart textPart)
                    {
                        contentItems.Add(new ChatMessageTextContentItem(textPart.Text));
                    }
                    else if (contentPart is ImageContentPart imagePart)
                    {
                        contentItems.Add(new ChatMessageImageContentItem(new Uri(imagePart.ImageUrl)));
                    }
                }
            }

            // Different roles map to different classes
            if (role == ChatRole.User)
            {
                ChatRequestUserMessage userMessage;
                if (content != null)
                {
                    userMessage = new(content);
                }
                else
                {
                    userMessage = new(contentItems);
                }

                if (chatMessage.Name != null)
                {
                    userMessage.Name = chatMessage.Name;
                }

                message = userMessage;
            }

            if (role == ChatRole.Assistant)
            {
                ChatRequestAssistantMessage assistantMessage = new(chatMessage.GetContent<string>());

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

                if (chatMessage.Name != null)
                {
                    assistantMessage.Name = chatMessage.Name;
                }

                message = assistantMessage;
            }

            if (role == ChatRole.System)
            {
                ChatRequestSystemMessage systemMessage = new(chatMessage.GetContent<string>());

                if (chatMessage.Name != null)
                {
                    systemMessage.Name = chatMessage.Name;
                }

                message = systemMessage;
            }

            if (role == ChatRole.Function)
            {
                message = new ChatRequestFunctionMessage(chatMessage.Name ?? "", chatMessage.GetContent<string>());
            }

            if (role == ChatRole.Tool)
            {
                message = new ChatRequestToolMessage(chatMessage.GetContent<string>(), chatMessage.ToolCallId ?? "");
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
