namespace Microsoft.Teams.AI.AI.Models
{
    /// <summary>
    /// Provides extension methods for the <see cref="Azure.AI.OpenAI.ChatMessage"/> class.
    /// </summary>
    internal static class AzureSdkChatMessageExtensions
    {
        /// <summary>
        /// Converts an <see cref="Azure.AI.OpenAI.ChatMessage"/> to a <see cref="ChatMessage"/>.
        /// </summary>
        /// <param name="chatMessage">The original <see cref="Azure.AI.OpenAI.ChatMessage" />.</param>
        /// <returns>A <see cref="ChatMessage"/>.</returns>
        public static ChatMessage ToChatMessage(this Azure.AI.OpenAI.ChatMessage chatMessage)
        {
            ChatMessage message = new(new ChatRole(chatMessage.Role.ToString()))
            {
                Content = chatMessage.Content,
                Name = chatMessage.Name,
                FunctionCall = new FunctionCall(chatMessage.FunctionCall.Name, chatMessage.FunctionCall.Arguments)
            };
            return message;
        }
    }
}
