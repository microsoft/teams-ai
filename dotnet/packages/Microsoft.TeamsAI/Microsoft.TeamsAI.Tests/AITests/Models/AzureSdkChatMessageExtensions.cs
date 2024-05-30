using Microsoft.Teams.AI.AI.Models;
using Microsoft.Teams.AI.Exceptions;

namespace Microsoft.Teams.AI.Tests.AITests.Models
{
    public class AzureSdkChatMessageExtensions
    {
        [Fact]
        public void Test_ChatCompletionsToolCall_ToFunctionToolCall()
        {
            // Arrange
            var functionToolCall = new Azure.AI.OpenAI.ChatCompletionsFunctionToolCall("test-id", "test-name", "test-arg1");

            // Act
            var azureSdkFunctionToolCall = functionToolCall.ToChatCompletionsToolCall();

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
            var ex = Assert.Throws<TeamsAIException>(() => functionToolCall.ToChatCompletionsToolCall());

            // Assert
            Assert.Equal($"Invalid ChatCompletionsToolCall type: {nameof(InvalidToolCall)}", ex.Message);
        }

        private sealed class InvalidToolCall : Azure.AI.OpenAI.ChatCompletionsToolCall
        {
            public InvalidToolCall() : base("test-id")
            {
            }
        }
    }
}
