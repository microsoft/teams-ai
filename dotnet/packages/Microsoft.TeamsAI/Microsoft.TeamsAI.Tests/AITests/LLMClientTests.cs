using System.ClientModel.Primitives;
using Microsoft.Bot.Builder;
using Microsoft.Teams.AI.AI.Clients;
using Microsoft.Teams.AI.AI.Models;
using Microsoft.Teams.AI.AI.Prompts;
using Microsoft.Teams.AI.AI.Tokenizers;
using Microsoft.Teams.AI.AI.Validators;
using Microsoft.Teams.AI.Application;
using Microsoft.Teams.AI.Exceptions;
using Microsoft.Teams.AI.State;
using Microsoft.Teams.AI.Tests.TestUtils;
using Moq;
using OpenAI.Chat;
using static Microsoft.Teams.AI.AI.Models.IPromptCompletionModelEvents;
using ChatMessage = Microsoft.Teams.AI.AI.Models.ChatMessage;

namespace Microsoft.Teams.AI.Tests.AITests
{
    public class LLMClientTests
    {
        [Fact]
        public void Test_Constructor_LogRepairs_Requires_LoggerFactory()
        {
            // Arrange
            var promptCompletionModel = new TestPromptCompletionModel();
            var promptTemplate = new PromptTemplate(
                "prompt",
                new(new() { })
            );
            LLMClientOptions<object> options = new(promptCompletionModel, promptTemplate) { LogRepairs = true };

            // Act
            Exception ex = Assert.Throws<ArgumentException>(() => new LLMClient<object>(options, null));

            // Assert
            Assert.Equal("`loggerFactory` parameter cannot be null if `LogRepairs` option is set to true", ex.Message);
        }

        [Fact]
        public void Test_AddFunctionResultToHistory_MemoryUpdated()
        {
            // Arrange
            var promptCompletionModel = new TestPromptCompletionModel();
            var promptTemplate = new PromptTemplate(
                "prompt",
                new(new() { })
            );
            LLMClientOptions<object> options = new(promptCompletionModel, promptTemplate);
            LLMClient<object> client = new(options, null);
            TestMemory memory = new();

            // Act
            client.AddFunctionResultToHistory(memory, "function", "results");

            // Assert
            var history = (List<ChatMessage>?)memory.Values.GetValueOrDefault(options.HistoryVariable);
            Assert.NotNull(history);
            Assert.Single(history);
            Assert.Equal(history.First().Role, ChatRole.Function);
            Assert.Equal("function", history.First().Name);
            Assert.Equal(history.First().Content, "results");
        }

        [Fact]
        public void Test_AddFunctionResultToHistory_ExceedMaxHistoryMessages()
        {
            // Arrange
            var promptCompletionModel = new TestPromptCompletionModel();
            var promptTemplate = new PromptTemplate(
                "prompt",
                new(new() { })
            );
            LLMClientOptions<object> options = new(promptCompletionModel, promptTemplate) { MaxHistoryMessages = 1 };
            LLMClient<object> client = new(options, null);
            TestMemory memory = new();

            // Act
            client.AddFunctionResultToHistory(memory, "function-0", "results-0");
            client.AddFunctionResultToHistory(memory, "function-1", "results-1");

            // Assert
            var history = (List<ChatMessage>?)memory.Values.GetValueOrDefault(options.HistoryVariable);
            Assert.NotNull(history);
            Assert.Single(history);
            Assert.Equal(history.First().Role, ChatRole.Function);
            Assert.Equal("function-1", history.First().Name);
            Assert.Equal(history.First().Content, "results-1");
        }

        [Fact]
        public async Task Test_CompletePromptAsync_PromptResponse_NotSuccess()
        {
            // Arrange
            var promptCompletionModel = new TestPromptCompletionModel();
            var promptTemplate = new PromptTemplate(
                "prompt",
                new(new() { })
            );
            LLMClientOptions<object> options = new(promptCompletionModel, promptTemplate) { MaxHistoryMessages = 1 };
            LLMClient<object> client = new(options, null);
            TestMemory memory = new();
            ChatMessage message = new ChatMessage("Hi there");
            promptCompletionModel.Results.Enqueue(new()
            {
                Input = new List<ChatMessage>() { message },
                Status = PromptResponseStatus.Error,
                Error = new TeamsAIException("test")
            });

            // Act
            var response = await client.CompletePromptAsync(new Mock<ITurnContext>().Object, memory, new PromptManager());

            // Assert
            Assert.NotNull(response);
            Assert.Equal(PromptResponseStatus.Error, response.Status);
            Assert.NotNull(response.Error);
            Assert.Equal("test", response.Error.Message);
            Assert.Single(memory.Values);

            IList<ChatMessage> conversation_history = (IList<ChatMessage>)memory.GetValue("conversation.history")!;
            Assert.True(conversation_history[0].Content  ==  message.Content);
        }

        [Fact]
        public async Task Test_CompletePromptAsync_PromptResponse_Success()
        {
            // Arrange
            var promptCompletionModel = new TestPromptCompletionModel();
            var promptTemplate = new PromptTemplate(
                "prompt",
                new(new() { })
            );
            LLMClientOptions<object> options = new(promptCompletionModel, promptTemplate);
            LLMClient<object> client = new(options, null);
            TestMemory memory = new();
            promptCompletionModel.Results.Enqueue(new()
            {
                Status = PromptResponseStatus.Success,
                Message = new(ChatRole.Assistant)
                {
                    Content = "welcome"
                }
            });

            memory.SetValue("temp.input", "hello");

            // Act
            var response = await client.CompletePromptAsync(new Mock<ITurnContext>().Object, memory, new PromptManager());

            // Assert
            Assert.NotNull(response);
            Assert.Equal(PromptResponseStatus.Success, response.Status);
            Assert.Null(response.Error);
            Assert.NotNull(response.Message);
            Assert.Equal(ChatRole.Assistant, response.Message.Role);
            Assert.Equal("welcome", response.Message.Content);
            Assert.Equal(2, memory.Values.Count);
            Assert.Equal("hello", memory.Values[options.InputVariable]);
            Assert.Equal(2, ((List<ChatMessage>)memory.Values[options.HistoryVariable]).Count);
        }

        [Fact]
        public async Task Test_CompletePromptAsync_Streaming_Success()
        {
            // Arrange
            List<string> chunks = new();
            chunks.Add("h");
            chunks.Add("i");
            var promptCompletionModel = TestPromptCompletionStreamingModel.StreamTextChunks(chunks);
            var promptTemplate = new PromptTemplate(
                "prompt",
                new(new() { })
            );

            ResponseReceivedHandler handler = new((object sender, ResponseReceivedEventArgs args) =>
            {
                Assert.Equal("hi", args.Streamer.Message);
            });

            LLMClientOptions<object> options = new(promptCompletionModel, promptTemplate)
            {
                StartStreamingMessage = "Begin streaming",
                EndStreamHandler = handler,
                EnableFeedbackLoop = true,
            };
            LLMClient<object> client = new(options, null);
            TestMemory memory = new();

            // Act
            var response = await client.CompletePromptAsync(new Mock<ITurnContext>().Object, memory, new PromptManager());

            // Assert
            Assert.NotNull(response);
            Assert.Equal(PromptResponseStatus.Success, response.Status);
            Assert.Null(response.Error);
            Assert.NotNull(response.Message);
            Assert.Equal(ChatRole.Assistant, response.Message.Role);
            Assert.Equal("hi", response.Message.Content);
        }

        [Fact]
        public async Task Test_CompletePromptAsync_PromptResponse_Exception()
        {
            // Arrange
            var promptCompletionModelMock = new Mock<IPromptCompletionModel>();
            var promptTemplate = new PromptTemplate(
                "prompt",
                new(new() { })
            );
            LLMClientOptions<object> options = new(promptCompletionModelMock.Object, promptTemplate);
            LLMClient<object> client = new(options, null);
            TestMemory memory = new();

            // Act
            var response = await client.CompletePromptAsync(new Mock<ITurnContext>().Object, memory, new PromptManager());

            // Assert
            Assert.NotNull(response);
            Assert.Equal(PromptResponseStatus.Error, response.Status);
            Assert.NotNull(response.Error);
        }

        [Fact]
        public async Task Test_CompletePromptAsync_PromptResponse_Repair()
        {
            // Arrange
            var promptCompletionModel = new TestPromptCompletionModel();
            var promptTemplate = new PromptTemplate(
                "prompt",
                new(new() { })
            );
            var validator = new TestValidator();
            LLMClientOptions<object> options = new(promptCompletionModel, promptTemplate)
            {
                LogRepairs = true,
                Validator = validator
            };
            LLMClient<object> client = new(options, new TestLoggerFactory());
            TestMemory memory = new();
            promptCompletionModel.Results.Enqueue(new()
            {
                Status = PromptResponseStatus.Success,
                Message = new(ChatRole.Assistant)
                {
                    Content = "welcome"
                }
            });
            promptCompletionModel.Results.Enqueue(new()
            {
                Status = PromptResponseStatus.Success,
                Message = new(ChatRole.Assistant)
                {
                    Content = "welcome-repair"
                }
            });
            validator.Results.Enqueue(new()
            {
                Valid = false
            });
            validator.Results.Enqueue(new()
            {
                Valid = true
            });

            memory.SetValue("temp.input", "hello");

            // Act
            var response = await client.CompletePromptAsync(new Mock<ITurnContext>().Object, memory, new PromptManager());

            // Assert
            Assert.NotNull(response);
            Assert.Equal(PromptResponseStatus.Success, response.Status);
            Assert.Null(response.Error);
            Assert.NotNull(response.Message);
            Assert.Equal(ChatRole.Assistant, response.Message.Role);
            Assert.Equal("welcome-repair", response.Message.Content);
            Assert.Equal(2, memory.Values.Count);
            Assert.Equal("hello", memory.Values[options.InputVariable]);
            Assert.Equal(2, ((List<ChatMessage>)memory.Values[options.HistoryVariable]).Count);
        }

        [Fact]
        public async Task Test_CompletePromptAsync_PromptResponse_RepairNotSuccess()
        {
            // Arrange
            var promptCompletionModel = new TestPromptCompletionModel();
            var promptTemplate = new PromptTemplate(
                "prompt",
                new(new() { })
            );
            var validator = new TestValidator();
            LLMClientOptions<object> options = new(promptCompletionModel, promptTemplate)
            {
                LogRepairs = true,
                Validator = validator
            };
            LLMClient<object> client = new(options, new TestLoggerFactory());
            TestMemory memory = new();
            promptCompletionModel.Results.Enqueue(new()
            {
                Status = PromptResponseStatus.Success,
                Message = new(ChatRole.Assistant)
                {
                    Content = "welcome"
                }
            });
            promptCompletionModel.Results.Enqueue(new()
            {
                Status = PromptResponseStatus.Success,
                Message = new(ChatRole.Assistant)
                {
                    Content = "welcome-repair"
                }
            });
            promptCompletionModel.Results.Enqueue(new()
            {
                Status = PromptResponseStatus.Error,
                Error = new("test")
            });
            validator.Results.Enqueue(new()
            {
                Valid = false
            });
            validator.Results.Enqueue(new()
            {
                Valid = false
            });
            validator.Results.Enqueue(new()
            {
                Valid = true
            });

            memory.SetValue("temp.input", "hello");

            // Act
            var response = await client.CompletePromptAsync(new Mock<ITurnContext>().Object, memory, new PromptManager());

            // Assert
            Assert.NotNull(response);
            Assert.Equal(PromptResponseStatus.Error, response.Status);
            Assert.NotNull(response.Error);
            Assert.Equal("test", response.Error.Message);
            Assert.Single(memory.Values);
            Assert.Equal("hello", memory.Values[options.InputVariable]);
        }

        [Fact]
        public async Task Test_CompletePromptAsync_PromptResponse_Repair_ExceedMaxRepairAttempts()
        {
            // Arrange
            var promptCompletionModel = new TestPromptCompletionModel();
            var promptTemplate = new PromptTemplate(
                "prompt",
                new(new() { })
            );
            var validator = new TestValidator();
            LLMClientOptions<object> options = new(promptCompletionModel, promptTemplate)
            {
                LogRepairs = true,
                Validator = validator,
                MaxRepairAttempts = 1
            };
            LLMClient<object> client = new(options, new TestLoggerFactory());
            TestMemory memory = new();
            promptCompletionModel.Results.Enqueue(new()
            {
                Status = PromptResponseStatus.Success,
                Message = new(ChatRole.Assistant)
                {
                    Content = "welcome"
                }
            });
            promptCompletionModel.Results.Enqueue(new()
            {
                Status = PromptResponseStatus.Success,
                Message = new(ChatRole.Assistant)
                {
                    Content = "welcome-repair"
                }
            });
            promptCompletionModel.Results.Enqueue(new()
            {
                Status = PromptResponseStatus.Success,
                Message = new(ChatRole.Assistant)
                {
                    Content = "welcome-repair-again"
                }
            });
            validator.Results.Enqueue(new()
            {
                Valid = false
            });
            validator.Results.Enqueue(new()
            {
                Valid = false
            });
            validator.Results.Enqueue(new()
            {
                Valid = true
            });

            memory.SetValue("temp.input", "hello");

            // Act
            var response = await client.CompletePromptAsync(new Mock<ITurnContext>().Object, memory, new PromptManager());

            // Assert
            Assert.NotNull(response);
            Assert.Equal(PromptResponseStatus.InvalidResponse, response.Status);
            Assert.NotNull(response.Error);
            Assert.Equal("Reached max model response repair attempts. Last feedback given to model: \"The response was invalid. Try another strategy.\"", response.Error.Message);
            Assert.Single(memory.Values);
            Assert.Equal("hello", memory.Values[options.InputVariable]);
        }

        [Fact]
        public async Task Test_CompletePromptAsync_PromptResponse_DisableHistory()
        {
            // Arrange
            var promptCompletionModel = new TestPromptCompletionModel();
            var promptTemplate = new PromptTemplate(
                "prompt",
                new(new() { })
            );
            LLMClientOptions<object> options = new(promptCompletionModel, promptTemplate)
            {
                HistoryVariable = string.Empty,
            };
            LLMClient<object> client = new(options, null);
            TestMemory memory = new();
            promptCompletionModel.Results.Enqueue(new()
            {
                Status = PromptResponseStatus.Success,
                Message = new(ChatRole.Assistant)
                {
                    Content = "welcome"
                }
            });

            // Act
            var response = await client.CompletePromptAsync(new Mock<ITurnContext>().Object, memory, new PromptManager());

            // Assert
            Assert.NotNull(response);
            Assert.Equal(PromptResponseStatus.Success, response.Status);
            Assert.Null(response.Error);
            Assert.NotNull(response.Message);
            Assert.Equal(ChatRole.Assistant, response.Message.Role);
            Assert.Equal("welcome", response.Message.Content);
            Assert.Empty(memory.Values);
        }

        [Fact]
        public async Task Test_CompletePromptAsync_PromptResponse_DisableRepair()
        {
            // Arrange
            var promptCompletionModel = new TestPromptCompletionModel();
            var promptTemplate = new PromptTemplate(
                "prompt",
                new(new() { })
            );
            var validator = new TestValidator();
            LLMClientOptions<object> options = new(promptCompletionModel, promptTemplate)
            {
                LogRepairs = true,
                MaxRepairAttempts = 0,
                Validator = validator
            };
            LLMClient<object> client = new(options, new TestLoggerFactory());
            TestMemory memory = new();
            promptCompletionModel.Results.Enqueue(new()
            {
                Status = PromptResponseStatus.Success,
                Message = new(ChatRole.Assistant)
                {
                    Content = "welcome"
                }
            });
            validator.Results.Enqueue(new()
            {
                Valid = false
            });

            memory.SetValue("temp.input", "hello");

            // Act
            var response = await client.CompletePromptAsync(new Mock<ITurnContext>().Object, memory, new PromptManager());

            // Assert
            Assert.NotNull(response);
            Assert.Equal(PromptResponseStatus.Success, response.Status);
            Assert.Null(response.Error);
            Assert.NotNull(response.Message);
            Assert.Equal(ChatRole.Assistant, response.Message.Role);
            Assert.Equal("welcome", response.Message.Content);
            Assert.Single(memory.Values);
            Assert.Equal("hello", memory.Values[options.InputVariable]);
        }

        private sealed class TestMemory : IMemory
        {
            public Dictionary<string, object> Values { get; set; } = new Dictionary<string, object>();

            public void DeleteValue(string path)
            {
                Values.Remove(path);
            }

            public object? GetValue(string path)
            {
                return Values.GetValueOrDefault(path);
            }

            public bool HasValue(string path)
            {
                return Values.ContainsKey(path);
            }

            public void SetValue(string path, object value)
            {
                Values[path] = value;
            }
        }

        private sealed class TestPromptCompletionModel : IPromptCompletionModel
        {
            public Queue<PromptResponse> Results { get; set; } = new Queue<PromptResponse>();

            public Task<PromptResponse> CompletePromptAsync(ITurnContext turnContext, IMemory memory, IPromptFunctions<List<string>> promptFunctions, ITokenizer tokenizer, PromptTemplate promptTemplate, CancellationToken cancellationToken)
            {
                return Task.FromResult(Results.Dequeue());
            }
        }

        private sealed class TestPromptCompletionStreamingModel : IPromptCompletionStreamingModel
        {
            public delegate Task<PromptResponse> Handler(TestPromptCompletionStreamingModel model, ITurnContext turnContext, IMemory memory, IPromptFunctions<List<string>> promptFunctions, ITokenizer tokenizer, PromptTemplate promptTemplate);

            public event Handler handler;

            public PromptCompletionModelEmitter? Events { get; set; } = new();

            public TestPromptCompletionStreamingModel(Handler handler)
            {
                this.handler = handler;
            }

            public static TestPromptCompletionStreamingModel StreamTextChunks(IList<string> chunks, int delay = 0)
            {
                Handler handler = new(async (TestPromptCompletionStreamingModel model, ITurnContext turnContext, IMemory memory, IPromptFunctions<List<string>> promptFunctions, ITokenizer tokenizer, PromptTemplate promptTemplate) =>
                {
                    BeforeCompletionEventArgs args = new(turnContext, memory, promptFunctions, tokenizer, promptTemplate, true);

                    model.Events = new();

                    model.Events.OnBeforeCompletion(args);

                    string content = "";

                    for (int i = 0; i < chunks.Count; i++)
                    {
                        await Task.Delay(TimeSpan.FromSeconds(0));
                        string text = chunks[i];
                        content += text;
                        if (i == 0)
                        {
                            var update = ModelReaderWriter.Read<StreamingChatCompletionUpdate>(BinaryData.FromString(@$"{{
                                ""choices"": [
                                    {{
                                        ""finish_reason"": null,
                                        ""delta"": {{
                                            ""role"": ""assistant"",
                                            ""content"": ""${content}""
                                        }}
                                    }}
                                ]
                            }}"));

                            ChatMessage currDeltaMessage = new(update!);
                            PromptChunk chunk = new() { delta = currDeltaMessage };

                            ChunkReceivedEventArgs firstChunkArgs = new(turnContext, memory, chunk);

                            model.Events.OnChunkReceived(firstChunkArgs);
                        }
                        else
                        {
                            var update = ModelReaderWriter.Read<StreamingChatCompletionUpdate>(BinaryData.FromString(@$"{{
                                ""choices"": [
                                    {{
                                        ""finish_reason"": null,
                                        ""delta"": {{
                                            ""content"": ""${content}""
                                        }}
                                    }}
                                ]
                            }}"));

                            ChatMessage currDeltaMessage = new(update!);
                            PromptChunk chunk = new() { delta = currDeltaMessage };

                            ChunkReceivedEventArgs secondChunkArgs = new(turnContext, memory, chunk);

                            model.Events.OnChunkReceived(secondChunkArgs);
                        }

                    }

                    await Task.Delay(TimeSpan.FromSeconds(delay));
                    PromptResponse response = new()
                    {
                        Status = PromptResponseStatus.Success,
                        Message = new(ChatRole.Assistant)
                        {
                            Content = content,
                        }
                    };
                    StreamingResponse streamer = new(turnContext);
                    ResponseReceivedEventArgs responseReceivedEventArgs = new(turnContext, memory, response, streamer);

                    model.Events.OnResponseReceived(responseReceivedEventArgs);
                    return response;
                });

                return new TestPromptCompletionStreamingModel(handler);
            }

            public Task<PromptResponse> CompletePromptAsync(ITurnContext turnContext, IMemory memory, IPromptFunctions<List<string>> promptFunctions, ITokenizer tokenizer, PromptTemplate promptTemplate, CancellationToken cancellationToken)
            {
                return this.handler(this, turnContext, memory, promptFunctions, tokenizer, promptTemplate);
            }
        }

        private sealed class TestValidator : IPromptResponseValidator
        {

            public Queue<Validation> Results { get; set; } = new Queue<Validation>();

            public Task<Validation> ValidateResponseAsync(ITurnContext context, IMemory memory, ITokenizer tokenizer, PromptResponse response, int remainingAttempts, CancellationToken cancellationToken = default)
            {
                return Task.FromResult(Results.Dequeue());
            }
        }
    }
}
