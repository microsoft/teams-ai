using Microsoft.Teams.AI.AI.Models;
using Microsoft.Teams.AI.Tests.TestUtils;
using OpenAI.Assistants;

namespace Microsoft.Teams.AI.Tests.AITests
{
    public class AssistantsMessageTest
    {
        [Fact]
        public void Test_Constructor()
        {
            // Arrange
            MessageContent content = OpenAIModelFactory.CreateMessageContent("message", "fileId");

            // Act
            AssistantsMessage assistantMessage = new AssistantsMessage(content);

            // Assert
            Assert.Equal(assistantMessage.MessageContent, content);

            ChatMessage chatMessage = assistantMessage;
            Assert.NotNull(chatMessage);
            Assert.Equal(chatMessage.Content, "message");
            Assert.Equal(chatMessage.Context!.Citations[0].Url, "fileId");
            Assert.Equal(chatMessage.Context.Citations[0].Title, "");
            Assert.Equal(chatMessage.Context.Citations[0].Content, "");
        }
    }
}
