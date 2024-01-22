using Microsoft.Teams.AI.AI.Models;

namespace Microsoft.Teams.AI.Tests.AITests.Models
{
    public class ChatMessageExtensionsTests
    {
        [Fact]
        public void Test_ToAzureSdkChatMessage()
        {
            // Arrange
            var chatMessage = new ChatMessage(ChatRole.User)
            {
                Name = "test-name",
                Content = "test-content",
            };

            // Act
            var result1 = chatMessage.ToAzureSdkChatMessage();
            chatMessage.FunctionCall = new FunctionCall("test-name", "test-args");
            var result2 = chatMessage.ToAzureSdkChatMessage();

            // Assert
            Assert.Equal(Azure.AI.OpenAI.ChatRole.User, result1.Role);
            Assert.Equal("test-name", result1.Name);
            Assert.Equal("test-content", result1.Content);
            Assert.Null(result1.FunctionCall);
            Assert.Equal("test-name", result2.FunctionCall.Name);
            Assert.Equal("test-args", result2.FunctionCall.Arguments);
        }
    }
}
