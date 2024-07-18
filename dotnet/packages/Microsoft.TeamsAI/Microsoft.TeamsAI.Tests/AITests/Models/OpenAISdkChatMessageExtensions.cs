using Microsoft.Teams.AI.AI.Models;
using OpenAI.Chat;
using System.ClientModel.Primitives;

namespace Microsoft.Teams.AI.Tests.AITests.Models
{
    public class OpenAISdkChatMessageExtensions
    {
        [Fact]
        public void Test_ChatCompletionsToolCall_ToFunctionToolCall()
        {
            // Arrange
            var functionToolCall = ChatToolCall.CreateFunctionToolCall("test-id", "test-name", "test-arg1");

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
        public void Test_ToChatMessage()
        {
            // Arrange
            var chatCompletion = ModelReaderWriter.Read<ChatCompletion>(BinaryData.FromString(@$"{{
                ""choices"": [
                    {{
                        ""finish_reason"": ""stop"",
                        ""message"": {{
                            ""role"": ""assistant"",
                            ""content"": ""test-choice"",
                            ""context"": {{
                                ""citations"": [
                                    {{
                                        ""title"": ""test-title"",
                                        ""url"": ""test-url"",
                                        ""content"": ""test-content""
                                    }}
                                ]
                            }}
                        }}
                    }}
                ]
            }}"));

            // Act
            var message = chatCompletion!.ToChatMessage();

            // Assert
            Assert.Equal("test-choice", message.Content);
            Assert.Equal(ChatRole.Assistant, message.Role);

            var context = message.Context;
            Assert.NotNull(context);
            Assert.Equal(1, context.Citations.Count);
            Assert.Equal("test-title", context.Citations[0].Title);
            Assert.Equal("test-url", context.Citations[0].Url);
            Assert.Equal("test-content", context.Citations[0].Content);
        }
    }
}
