using Azure.AI.OpenAI;
using Azure.AI.OpenAI.Chat;
using Microsoft.Teams.AI.Exceptions;
using OpenAI.Chat;
using OAI = OpenAI;

namespace Microsoft.Teams.AI.AI.Models
{
    /// <summary>
    /// Provides extension methods for the <see cref="ChatCompletion"/> class.
    /// </summary>
    internal static class OpenAISdkChatMessageExensions
    {
        /// <summary>
        /// Converts an <see cref="ChatCompletion"/> to a <see cref="ChatMessage"/>.
        /// </summary>
        /// <param name="chatCompletion">The original <see cref="OAI.Chat.ChatMessage" />.</param>
        /// <returns>A <see cref="ChatMessage"/>.</returns>
        public static ChatMessage ToChatMessage(this ChatCompletion chatCompletion)
        {
            ChatMessage message = new(ChatRole.Assistant)
            {
                Content = chatCompletion.Content[0].Text,
            };

            if (chatCompletion.FunctionCall != null && chatCompletion.FunctionCall.FunctionName != string.Empty)
            {
                message.Name = chatCompletion.FunctionCall.FunctionName;
                message.FunctionCall = new FunctionCall(chatCompletion.FunctionCall.FunctionName, chatCompletion.FunctionCall.FunctionArguments);
            }

            if (chatCompletion.ToolCalls != null && chatCompletion.ToolCalls.Count > 0)
            {
                message.ToolCalls = new List<ChatCompletionsToolCall>();
                foreach (ChatToolCall toolCall in chatCompletion.ToolCalls)
                {
                    message.ToolCalls.Add(toolCall.ToChatCompletionsToolCall());
                }
            }

#pragma warning disable AOAI001 // Type is for evaluation purposes only and is subject to change or removal in future updates. Suppress this diagnostic to proceed.
            MessageContext? context = chatCompletion.GetAzureMessageContext()?.ToMessageContext();
#pragma warning restore AOAI001 // Type is for evaluation purposes only and is subject to change or removal in future updates. Suppress this diagnostic to proceed.

            if (context != null)
            {
                message.Context = context;
            }

            return message;
        }

        public static ChatCompletionsToolCall ToChatCompletionsToolCall(this ChatToolCall toolCall)
        {
            if (toolCall.Kind == ChatToolCallKind.Function)
            {
                return new ChatCompletionsFunctionToolCall(toolCall.Id, toolCall.FunctionName, toolCall.FunctionArguments);
            }

            throw new TeamsAIException($"Invalid ChatCompletionsToolCall type: {toolCall.GetType().Name}");
        }

        public static MessageContext ToMessageContext(this AzureChatMessageContext azureContext)
        {
            MessageContext message = new();
            foreach (AzureChatCitation citation in azureContext.Citations)
            {
                message.Citations.Add(new Citation(citation.Content, citation.Title, citation.Url));
            }

            message.Intent = azureContext.Intent;

            return message;
        }
    }
}
