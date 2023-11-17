namespace Microsoft.Teams.AI.AI.Models
{
    /// <summary>
    /// Provides extension methods for the <see cref="ChatMessage"/> class.
    /// </summary>
    internal static class ChatMessageExtensions
    {
        /// <summary>
        /// Converts a <see cref="ChatMessage"/> to an <see cref="Azure.AI.OpenAI.ChatMessage"/>.
        /// </summary>
        /// <param name="chatMessage">The original <see cref="ChatMessage" />.</param>
        /// <returns>An <see cref="Azure.AI.OpenAI.ChatMessage"/>.</returns>
        public static Azure.AI.OpenAI.ChatMessage ToAzureSdkChatMessage(this ChatMessage chatMessage)
        {
            Azure.AI.OpenAI.ChatMessage message = new(new Azure.AI.OpenAI.ChatRole(chatMessage.Role.ToString()), chatMessage.Content)
            {
                Name = chatMessage.Name,
            };
            if (chatMessage.FunctionCall != null)
            {
                message.FunctionCall = new Azure.AI.OpenAI.FunctionCall(chatMessage.FunctionCall.Name, chatMessage.FunctionCall.Arguments);
            }
            return message;
        }
    }
}
