using Microsoft.Bot.Builder;
using Microsoft.Teams.AI.AI.Clients;
using Microsoft.Teams.AI.AI.Models;
using Microsoft.Teams.AI.AI.Prompts;
using Microsoft.Teams.AI.AI.Tokenizers;
using Microsoft.Teams.AI.AI.Validators;
using Microsoft.Teams.AI.Exceptions;
using Microsoft.Teams.AI.State;
using Microsoft.Teams.AI.Tests.TestUtils;
using Moq;

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
            Assert.Equal(history.First().Name, "function");
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
            Assert.Equal(history.First().Name, "function-1");
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
            promptCompletionModel.Results.Enqueue(new()
            {
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
            Assert.Equal(0, memory.Values.Count);
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
            Assert.Equal(1, memory.Values.Count);
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
            Assert.Equal(1, memory.Values.Count);
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
            Assert.Equal(1, memory.Values.Count);
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
            Assert.Equal(1, memory.Values.Count);
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
