﻿using Microsoft.Teams.AI.AI.Models;
using Microsoft.Teams.AI.Exceptions;
using OpenAI.Chat;
using System.ClientModel.Primitives;
using ChatMessage = Microsoft.Teams.AI.AI.Models.ChatMessage;

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

        [Fact]
        public void Test_Initialization_From_OpenAISdk_ChatMessage()
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
            var message = new ChatMessage(chatCompletion!);

            // Assert
            Assert.Equal("test-choice", message.Content);
            Assert.Equal(ChatRole.Assistant, message.Role);

            var context = message.Context;
            Assert.NotNull(context);
            Assert.Single(context.Citations);
            Assert.Equal("test-title", context.Citations[0].Title);
            Assert.Equal("test-url", context.Citations[0].Url);
            Assert.Equal("test-content", context.Citations[0].Content);
        }

        [Fact]
        public void Test_Initialization_From_OpenAISdk_StreamingChatCompletionUpdate()
        {
            // Arrange
            var chatCompletion = ModelReaderWriter.Read<StreamingChatCompletionUpdate>(BinaryData.FromString(@$"{{
                ""choices"": [
                    {{
                        ""finish_reason"": null,
                        ""delta"": {{
                            ""role"": ""assistant"",
                            ""content"": ""hello""
                        }}
                    }}
                ]
            }}"));

            // Act
            var message = new ChatMessage(chatCompletion!);

            // Assert
            Assert.Equal("hello", message.Content);
            Assert.Equal(ChatRole.Assistant, message.Role);

            var context = message.Context;
            Assert.Null(context);
        }

        [Fact]
        public void Test_InvalidRole_ToOpenAISdkChatMessage()
        {
            // Arrange
            var chatMessage = new ChatMessage(new ChatRole("InvalidRole"))
            {
                Content = "test"
            };

            // Act
            var ex = Assert.Throws<TeamsAIException>(() => chatMessage.ToOpenAIChatMessage());

            // Assert
            Assert.Equal($"Invalid chat message role: InvalidRole", ex.Message);
        }

        [Fact]
        public void Test_UserRole_StringContent_ToOpenAISdkChatMessage()
        {
            // Arrange
            var chatMessage = new ChatMessage(ChatRole.User)
            {
                Content = "test-content",
                Name = "author"
            };

            // Act
            var result = chatMessage.ToOpenAIChatMessage();

            // Assert
            var userMessage = result as UserChatMessage;
            Assert.NotNull(userMessage);
            Assert.Equal("test-content", result.Content[0].Text);
            // TODO: Uncomment once participant name issue is resolved.
            //Assert.Equal("author", userMessage.ParticipantName);
        }

        [Fact]
        public void Test_UserRole_MultiModalContent_ToOpenAISdkChatMessage()
        {
            // Arrange
            var messageContentParts = new List<MessageContentParts>() { new TextContentPart() { Text = "test" }, new ImageContentPart { ImageUrl = "https://www.testurl.com" } };
            var chatMessage = new ChatMessage(ChatRole.User)
            {
                Content = messageContentParts,
                Name = "author"
            };

            // Act
            var result = chatMessage.ToOpenAIChatMessage();

            // Assert
            var userMessage = result as UserChatMessage;
            Assert.NotNull(userMessage);
            Assert.Equal("test", userMessage.Content[0].Text);
            Assert.Equal("https://www.testurl.com", userMessage.Content[1].ImageUri.OriginalString);

            // TODO: Uncomment once participant name issue is resolved.
            //Assert.Equal("author", userMessage.ParticipantName);
        }

        [Fact]
        public void Test_AssistantRole_ToOpenAISdkChatMessage_FunctionCall()
        {
            // Arrange
            var functionCall = new FunctionCall("test-name", "test-arg1");
            var chatMessage = new ChatMessage(ChatRole.Assistant)
            {
                Content = "test-content",
                Name = "test-name",
                FunctionCall = functionCall,
            };

            // Act
            var result = chatMessage.ToOpenAIChatMessage();

            // Assert
            var assistantMessage = result as AssistantChatMessage;
            Assert.NotNull(assistantMessage);
            Assert.Equal("test-content", assistantMessage.Content[0].Text);
            // TODO: Uncomment when participant name issue is resolved.
            //Assert.Equal("test-name", assistantMessage.ParticipantName);
            Assert.Equal("test-arg1", assistantMessage.FunctionCall.FunctionArguments);
            Assert.Equal("test-name", assistantMessage.FunctionCall.FunctionName);
        }

        [Fact]
        public void Test_AssistantRole_ToOpenAISdkChatMessage_ActionCall()
        {
            // Arrange
            var chatMessage = new ChatMessage(ChatRole.Assistant)
            {
                Content = "test-content",
                Name = "test-name",
                ActionCalls = new List<ActionCall>()
                {
                    new ActionCall("test-id", new ActionFunction("test-tool-name", "test-tool-arg1"))
                }
            };

            // Act
            var result = chatMessage.ToOpenAIChatMessage();

            // Assert
            var assistantMessage = result as AssistantChatMessage;
            Assert.NotNull(assistantMessage);
            Assert.Equal("test-content", assistantMessage.Content[0].Text);
            // TODO: Uncomment when participant name issue is resolved.
            //Assert.Equal("test-name", assistantMessage.ParticipantName);

            Assert.Single(assistantMessage.ToolCalls);
            ChatToolCall toolCall = assistantMessage.ToolCalls[0];
            Assert.NotNull(toolCall);
            Assert.Equal("test-id", toolCall.Id);
            Assert.Equal("test-tool-name", toolCall.FunctionName);
            Assert.Equal("test-tool-arg1", toolCall.FunctionArguments);
        }

        [Fact]
        public void Test_SystemRole_ToOpenAISdkChatMessage()
        {
            // Arrange
            var chatMessage = new ChatMessage(ChatRole.System)
            {
                Content = "test-content",
                Name = "author"
            };

            // Act
            var result = chatMessage.ToOpenAIChatMessage();

            // Assert
            var systemMessage = result as SystemChatMessage;
            Assert.NotNull(systemMessage);
            Assert.Equal("test-content", systemMessage.Content[0].Text);
            // TODO: Uncomment when participant name issue is resolved.
            //Assert.Equal("author", systemMessage.ParticipantName);
        }

        [Fact]
        public void Test_FunctionRole_ToOpenAISdkChatMessage()
        {
            // Arrange
            var chatMessage = new ChatMessage(ChatRole.Function)
            {
                Content = "test-content",
                Name = "function-name"
            };

            // Act
            var result = chatMessage.ToOpenAIChatMessage();

            // Assert
            var functionMessage = result as FunctionChatMessage;
            Assert.NotNull(functionMessage);
            Assert.Equal("test-content", functionMessage.Content[0].Text);
        }

        [Fact]
        public void Test_ToolRole_ToOpenAISdkChatMessage()
        {
            // Arrange
            var chatMessage = new ChatMessage(ChatRole.Tool)
            {
                Content = "test-content",
                Name = "tool-name",
                ActionCallId = "action-call-id"
            };

            // Act
            var result = chatMessage.ToOpenAIChatMessage();

            // Assert
            var toolMessage = result as ToolChatMessage;
            Assert.NotNull(toolMessage);
            Assert.Equal("test-content", toolMessage.Content[0].Text);
            Assert.Equal("action-call-id", toolMessage.ToolCallId);
        }
    }
}
