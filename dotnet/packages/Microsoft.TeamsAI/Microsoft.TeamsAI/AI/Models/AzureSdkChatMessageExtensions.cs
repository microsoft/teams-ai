using Azure.AI.OpenAI;
using Microsoft.Teams.AI.Exceptions;

namespace Microsoft.Teams.AI.AI.Models
{
    /// <summary>
    /// Provides extension methods for the <see cref="ChatResponseMessage"/> class.
    /// </summary>
    internal static class AzureSdkChatMessageExtensions
    {
        /// <summary>
        /// Converts an <see cref="ChatResponseMessage"/> to a <see cref="ChatMessage"/>.
        /// </summary>
        /// <param name="chatMessage">The original <see cref="ChatResponseMessage" />.</param>
        /// <returns>A <see cref="ChatMessage"/>.</returns>
        public static ChatMessage ToChatMessage(this ChatResponseMessage chatMessage)
        {
            ChatMessage message = new(new ChatRole(chatMessage.Role.ToString()))
            {
                Content = chatMessage.Content,
            };

            if (chatMessage.FunctionCall != null)
            {
                message.Name = chatMessage.FunctionCall.Name;
                message.FunctionCall = new FunctionCall(chatMessage.FunctionCall.Name, chatMessage.FunctionCall.Arguments);
            }

            if (chatMessage.ToolCalls != null && chatMessage.ToolCalls.Count > 0)
            {
                message.ToolCalls = new List<ChatCompletionsToolCall>();
                foreach (Azure.AI.OpenAI.ChatCompletionsToolCall toolCall in chatMessage.ToolCalls)
                {
                    message.ToolCalls.Add(toolCall.ToChatCompletionsToolCall());
                }

            }

            message.Context = new MessageContext();
            if (chatMessage.AzureExtensionsContext.Intent != null)
            {
                message.Context.Intent = chatMessage.AzureExtensionsContext.Intent;
            }

            IReadOnlyList<AzureChatExtensionDataSourceResponseCitation>? citations = chatMessage.AzureExtensionsContext.Citations;
            if (citations != null)
            {
                foreach (AzureChatExtensionDataSourceResponseCitation citation in citations)
                {
                    message.Context.Citations.Add(new Citation(citation.Content, citation.Title, citation.Url));
                };
            }

            return message;
        }

        public static ChatCompletionsToolCall ToChatCompletionsToolCall(this Azure.AI.OpenAI.ChatCompletionsToolCall toolCall)
        {
            if (toolCall is Azure.AI.OpenAI.ChatCompletionsFunctionToolCall azureFunctionToolCall)
            {
                return new ChatCompletionsFunctionToolCall(azureFunctionToolCall.Id, azureFunctionToolCall.Name, azureFunctionToolCall.Arguments);
            }

            throw new TeamsAIException($"Invalid ChatCompletionsToolCall type: {toolCall.GetType().Name}");
        }
    }
}
