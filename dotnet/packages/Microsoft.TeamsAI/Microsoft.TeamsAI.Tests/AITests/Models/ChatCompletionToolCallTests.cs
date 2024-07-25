using Microsoft.Teams.AI.AI.Models;
using Microsoft.Teams.AI.Exceptions;
using OpenAI.Chat;

namespace Microsoft.Teams.AI.Tests.AITests.Models
{
    internal class ChatCompletionToolCallTests
    {
        [Fact]
        public void Test_ChatCompletionsToolCall_ToFunctionToolCall()
        {
            // Arrange
            var functionToolCall = ChatToolCall.CreateFunctionToolCall("test-id", "test-name", "test-arg1");

            // Act
            var azureSdkFunctionToolCall = ChatCompletionsToolCall.FromChatToolCall(functionToolCall);

            // Assert
            var toolCall = azureSdkFunctionToolCall as ChatCompletionsFunctionToolCall;
            Assert.NotNull(toolCall);
            Assert.Equal("test-id", toolCall.Id);
            Assert.Equal("test-name", toolCall.Name);
            Assert.Equal("test-arg1", toolCall.Arguments);
        }

        [Fact]
        public void Test_ChatCompletionsToolCall_InvalidToolType()
        {
            // Arrange
            var functionToolCall = new InvalidToolCall();

            // Act
            var ex = Assert.Throws<TeamsAIException>(() => functionToolCall.ToChatToolCall());

            // Assert
            Assert.Equal("Invalid tool type: invalidToolType", ex.Message);
        }

        private sealed class InvalidToolCall : ChatCompletionsToolCall
        {
            public InvalidToolCall() : base("invalidToolType", "test-id")
            {
            }
        }
    }
}
