using Azure.AI.OpenAI;
using Microsoft.Teams.AI.AI.Models;
using Microsoft.Teams.AI.Exceptions;

namespace Microsoft.Teams.AI.Tests.AITests.Models
{
    public class ChatMessageExtensionsTests
    {
        [Fact]
        public void Test_InvalidRole_ToAzureSdkChatMessage()
        {
            // Arrange
            var chatMessage = new ChatMessage(new AI.Models.ChatRole("InvalidRole"))
            {
                Content = "test"
            };

            // Act
            var ex = Assert.Throws<TeamsAIException>(() => chatMessage.ToChatRequestMessage());

            // Assert
            Assert.Equal($"Invalid chat message role: InvalidRole", ex.Message);
        }

        [Fact]
        public void Test_UserRole_StringContent_ToAzureSdkChatMessage()
        {
            // Arrange
            var chatMessage = new ChatMessage(AI.Models.ChatRole.User)
            {
                Content = "test-content",
                Name = "author"
            };

            // Act
            var result = chatMessage.ToChatRequestMessage();

            // Assert
            Assert.Equal(Azure.AI.OpenAI.ChatRole.User, result.Role);
            Assert.Equal(typeof(ChatRequestUserMessage), result.GetType());
            Assert.Equal("test-content", ((ChatRequestUserMessage)result).Content);
            Assert.Equal("author", ((ChatRequestUserMessage)result).Name);
        }

        [Fact]
        public void Test_UserRole_MultiModalContent_ToAzureSdkChatMessage()
        {
            // Arrange
            var messageContentParts = new List<MessageContentParts>() { new TextContentPart() { Text = "test" }, new ImageContentPart { ImageUrl = "https://www.testurl.com" } };
            var chatMessage = new ChatMessage(AI.Models.ChatRole.User)
            {
                Content = messageContentParts,
                Name = "author"
            };

            // Act
            var result = chatMessage.ToChatRequestMessage();

            // Assert
            Assert.Equal(Azure.AI.OpenAI.ChatRole.User, result.Role);
            Assert.Equal(typeof(ChatRequestUserMessage), result.GetType());

            var userMessage = (ChatRequestUserMessage)result;

            Assert.Equal(null, userMessage.Content);
            Assert.Equal("test", ((ChatMessageTextContentItem)userMessage.MultimodalContentItems[0]).Text);
            Assert.Equal(typeof(ChatMessageImageContentItem), userMessage.MultimodalContentItems[1].GetType());
            Assert.Equal("author", userMessage.Name);
        }

        [Fact]
        public void Test_AssistantRole_ToAzureSdkChatMessage()
        {
            // Arrange
            var functionCall = new AI.Models.FunctionCall("test-name", "test-arg1");
            var chatMessage = new ChatMessage(AI.Models.ChatRole.Assistant)
            {
                Content = "test-content",
                Name = "test-name",
                FunctionCall = functionCall,
                ToolCalls = new List<AI.Models.ChatCompletionsToolCall>()
                {
                    new AI.Models.ChatCompletionsFunctionToolCall("test-id", "test-tool-name", "test-tool-arg1")
                }
            };

            // Act
            var result = chatMessage.ToChatRequestMessage();

            // Assert
            Assert.Equal(Azure.AI.OpenAI.ChatRole.Assistant, result.Role);
            ChatRequestAssistantMessage? message = result as ChatRequestAssistantMessage;
            Assert.NotNull(message);
            Assert.Equal("test-content", message.Content);
            Assert.Equal("test-name", message.Name);
            Assert.Equal("test-arg1", message.FunctionCall.Arguments);
            Assert.Equal("test-name", message.FunctionCall.Name);

            Assert.Equal(1, message.ToolCalls.Count);
            Azure.AI.OpenAI.ChatCompletionsFunctionToolCall? toolCall = message.ToolCalls[0] as Azure.AI.OpenAI.ChatCompletionsFunctionToolCall;
            Assert.NotNull(toolCall);
            Assert.Equal("test-id", toolCall.Id);
            Assert.Equal("test-tool-name", toolCall.Name);
            Assert.Equal("test-tool-arg1", toolCall.Arguments);
        }

        [Fact]
        public void Test_SystemRole_ToAzureSdkChatMessage()
        {
            // Arrange
            var chatMessage = new ChatMessage(AI.Models.ChatRole.System)
            {
                Content = "test-content",
                Name = "author"
            };

            // Act
            var result = chatMessage.ToChatRequestMessage();

            // Assert
            Assert.Equal(Azure.AI.OpenAI.ChatRole.System, result.Role);
            Assert.Equal(typeof(ChatRequestSystemMessage), result.GetType());
            Assert.Equal("test-content", ((ChatRequestSystemMessage)result).Content);
            Assert.Equal("author", ((ChatRequestSystemMessage)result).Name);
        }

        [Fact]
        public void Test_FunctionRole_ToAzureSdkChatMessage()
        {
            // Arrange
            var chatMessage = new ChatMessage(AI.Models.ChatRole.Function)
            {
                Content = "test-content",
                Name = "function-name"
            };

            // Act
            var result = chatMessage.ToChatRequestMessage();

            // Assert
            Assert.Equal(Azure.AI.OpenAI.ChatRole.Function, result.Role);
            Assert.Equal(typeof(ChatRequestFunctionMessage), result.GetType());
            Assert.Equal("test-content", ((ChatRequestFunctionMessage)result).Content);
        }

        [Fact]
        public void Test_ToolRole_ToAzureSdkChatMessage()
        {
            // Arrange
            var chatMessage = new ChatMessage(AI.Models.ChatRole.Tool)
            {
                Content = "test-content",
                Name = "tool-name",
                ToolCallId = "tool-call-id"
            };

            // Act
            var result = chatMessage.ToChatRequestMessage();

            // Assert
            Assert.Equal(Azure.AI.OpenAI.ChatRole.Tool, result.Role);
            Assert.Equal(typeof(ChatRequestToolMessage), result.GetType());
            Assert.Equal("test-content", ((ChatRequestToolMessage)result).Content);
            Assert.Equal("tool-call-id", ((ChatRequestToolMessage)result).ToolCallId);
        }

        [Fact]
        public void Test_ChatCompletionsToolCall_ToFunctionToolCall()
        {
            // Arrange
            var functionToolCall = new AI.Models.ChatCompletionsFunctionToolCall("test-id", "test-name", "test-arg1");

            // Act
            var azureSdkFunctionToolCall = functionToolCall.ToAzureSdkChatCompletionsToolCall();

            // Assert
            var toolCall = azureSdkFunctionToolCall as Azure.AI.OpenAI.ChatCompletionsFunctionToolCall;
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
            var ex = Assert.Throws<TeamsAIException>(() => functionToolCall.ToAzureSdkChatCompletionsToolCall());

            // Assert
            Assert.Equal("Invalid tool type: invalidToolType", ex.Message);
        }

        private sealed class InvalidToolCall : AI.Models.ChatCompletionsToolCall
        {
            public InvalidToolCall() : base("invalidToolType", "test-id")
            {
            }
        }
    }
}
