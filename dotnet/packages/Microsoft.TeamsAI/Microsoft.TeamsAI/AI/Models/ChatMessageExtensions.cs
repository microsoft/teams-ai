using Microsoft.Teams.AI.Exceptions;
using Microsoft.Teams.AI.Utilities;
using OpenAI.Chat;
using OAI = OpenAI;

namespace Microsoft.Teams.AI.AI.Models
{
    /// <summary>
    /// Provides extension methods for the <see cref="ChatMessage"/> class.
    /// </summary>
    internal static class ChatMessageExtensions
    {
        /// <summary>
        /// Converts a <see cref="ChatMessage"/> to an <see cref="OAI.Chat.ChatMessage"/>.
        /// </summary>
        /// <param name="chatMessage">The original <see cref="ChatMessage" />.</param>
        /// <returns>An <see cref="OAI.Chat.ChatMessage"/>.</returns>
        public static OAI.Chat.ChatMessage ToOpenAIChatMessage(this ChatMessage chatMessage)
        {
            Verify.NotNull(chatMessage.Content);
            Verify.NotNull(chatMessage.Role);

            ChatRole role = chatMessage.Role;
            OAI.Chat.ChatMessage? message = null;

            string? content = null;
            List<ChatMessageContentPart> contentItems = new();

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
                        contentItems.Add(ChatMessageContentPart.CreateTextMessageContentPart(textPart.Text));
                    }
                    else if (contentPart is ImageContentPart imagePart)
                    {
                        contentItems.Add(ChatMessageContentPart.CreateImageMessageContentPart(new Uri(imagePart.ImageUrl)));
                    }
                }
            }

            // Different roles map to different classes
            if (role == ChatRole.User)
            {
                UserChatMessage userMessage;
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
                    // TODO: Currently no way to set `ParticipantName` come and change it eventually.
                    //userMessage.ParticipantName = chatMessage.Name;
                }

                message = userMessage;
            }

            if (role == ChatRole.Assistant)
            {
                AssistantChatMessage assistantMessage;

                if (chatMessage.FunctionCall != null)
                {
                    ChatFunctionCall functionCall = new(chatMessage.FunctionCall.Name ?? "", chatMessage.FunctionCall.Arguments ?? "");
                    assistantMessage = new AssistantChatMessage(functionCall, chatMessage.GetContent<string>());
                }
                else if (chatMessage.ToolCalls != null)
                {
                    List<ChatToolCall> toolCalls = new();
                    foreach (ChatCompletionsToolCall toolCall in chatMessage.ToolCalls)
                    {
                        toolCalls.Add(toolCall.ToChatToolCall());
                    }
                    assistantMessage = new AssistantChatMessage(toolCalls, chatMessage.GetContent<string>());
                }
                else
                {
                    assistantMessage = new AssistantChatMessage(chatMessage.GetContent<string>());
                }

                if (chatMessage.Name != null)
                {
                    // TODO: Currently no way to set `ParticipantName` come and change it eventually.
                    // assistantMessage.ParticipantName = chatMessage.Name;
                }

                message = assistantMessage;
            }

            if (role == ChatRole.System)
            {
                SystemChatMessage systemMessage = new(chatMessage.GetContent<string>());

                if (chatMessage.Name != null)
                {
                    // TODO: Currently no way to set `ParticipantName` come and change it eventually.
                    // systemMessage.ParticipantName = chatMessage.Name;
                }

                message = systemMessage;
            }

            if (role == ChatRole.Function)
            {
                // TODO: Clean up
                message = new FunctionChatMessage(chatMessage.Name ?? "", chatMessage.GetContent<string>());
            }

            if (role == ChatRole.Tool)
            {

                message = new ToolChatMessage(chatMessage.ToolCallId ?? "", chatMessage.GetContent<string>());
            }

            if (message == null)
            {
                throw new TeamsAIException($"Invalid chat message role: {role}");
            }

            return message;
        }

        public static ChatToolCall ToChatToolCall(this ChatCompletionsToolCall toolCall)
        {
            if (toolCall.Type == ToolType.Function)
            {
                ChatCompletionsFunctionToolCall functionToolCall = (ChatCompletionsFunctionToolCall)toolCall;
                return ChatToolCall.CreateFunctionToolCall(functionToolCall.Id, functionToolCall.Name, functionToolCall.Arguments);
            }

            throw new TeamsAIException($"Invalid tool type: {toolCall.Type}");
        }
    }
}
