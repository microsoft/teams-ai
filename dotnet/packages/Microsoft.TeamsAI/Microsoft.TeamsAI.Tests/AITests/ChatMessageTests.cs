using Microsoft.Teams.AI.AI.Models;

namespace Microsoft.Teams.AI.Tests.AITests
{
    public class ChatMessageTests
    {
        [Fact]
        public void Test_Get_Content()
        {
            // Arrange
            ChatMessage msg = new(ChatRole.Assistant);
            msg.Content = "test";

            // Act
            var content = msg.GetContent<string>();

            // Assert
            Assert.Equal("test", content);
        }

        [Fact]
        public void Test_Get_Content_TypeMismatch_ThrowsException()
        {
            // Arrange
            ChatMessage msg = new(ChatRole.Assistant);
            msg.Content = "test";

            // Act & Assert
            Assert.Throws<InvalidCastException>(() => msg.GetContent<bool>());
        }
    }
}
