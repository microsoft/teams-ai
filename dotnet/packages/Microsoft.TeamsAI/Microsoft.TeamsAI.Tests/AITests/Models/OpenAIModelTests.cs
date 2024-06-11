using Azure;
using Azure.AI.OpenAI;
using Azure.Core;
using Microsoft.Bot.Builder;
using Microsoft.Teams.AI.AI.Models;
using Microsoft.Teams.AI.AI.Prompts;
using Microsoft.Teams.AI.AI.Prompts.Sections;
using Microsoft.Teams.AI.AI.Tokenizers;
using Microsoft.Teams.AI.State;
using Microsoft.Teams.AI.Tests.TestUtils;
using Moq;
using System.Diagnostics.CodeAnalysis;
using System.Reflection;
using ChatMessage = Microsoft.Teams.AI.AI.Models.ChatMessage;
using ChatRole = Microsoft.Teams.AI.AI.Models.ChatRole;

namespace Microsoft.Teams.AI.Tests.AITests.Models
{
    public class OpenAIModelTests
    {
        [Fact]
        public void Test_Constructor_OpenAI()
        {
            // Arrange
            var options = new OpenAIModelOptions("test-key", "test-model");

            // Act
            new OpenAIModel(options);
        }

        [Fact]
        public void Test_Constructor_AzureOpenAI_InvalidAzureApiVersion()
        {
            // Arrange
            var options = new AzureOpenAIModelOptions("test-key", "test-deployment", "https://test.openai.azure.com/");
            var versions = new List<string>
            {
                "2022-12-01", "2023-05-15", "2023-06-01-preview", "2023-07-01-preview", "2024-02-15-preview", "2024-03-01-preview"
            };

            // Act
            foreach (var version in versions)
            {
                options.AzureApiVersion = version;
                new OpenAIModel(options);
            }
            options.AzureApiVersion = "2023-12-01-preview";
            Exception exception = Assert.Throws<ArgumentException>(() => new OpenAIModel(options));

            // Assert
            Assert.Equal("Model created with an unsupported API version of `2023-12-01-preview`.", exception.Message);
        }

        [Fact]
        public async void Test_CompletePromptAsync_AzureOpenAI_Text_PromptTooLong()
        {
            // Arrange
            var turnContextMock = new Mock<ITurnContext>();
            var turnStateMock = new Mock<TurnState>();
            var renderedPrompt = new RenderedPromptSection<string>(string.Empty, length: 65536, tooLong: true);
            var promptMock = new Mock<Prompt>(new List<PromptSection>(), -1, true, "\n\n");
            promptMock.Setup((prompt) => prompt.RenderAsTextAsync(
                It.IsAny<ITurnContext>(), It.IsAny<IMemory>(), It.IsAny<IPromptFunctions<List<string>>>(),
                It.IsAny<ITokenizer>(), It.IsAny<int>(), It.IsAny<CancellationToken>())).ReturnsAsync(renderedPrompt);
            var promptTemplate = new PromptTemplate("test-prompt", promptMock.Object);
            var options = new AzureOpenAIModelOptions("test-key", "test-deployment", "https://test.openai.azure.com/")
            {
                CompletionType = CompletionConfiguration.CompletionType.Text,
                LogRequests = true
            };
            var openAIModel = new OpenAIModel(options, loggerFactory: new TestLoggerFactory());

            // Act
            var result = await openAIModel.CompletePromptAsync(turnContextMock.Object, turnStateMock.Object, new PromptManager(), new GPTTokenizer(), promptTemplate);

            // Assert
            Assert.Equal(PromptResponseStatus.TooLong, result.Status);
            Assert.NotNull(result.Error);
            Assert.Equal("The generated text completion prompt had a length of 65536 tokens which exceeded the MaxInputTokens of 2048.", result.Error.Message);
        }

        [Fact]
        public async void Test_CompletePromptAsync_AzureOpenAI_Text_RateLimited()
        {
            // Arrange
            var turnContextMock = new Mock<ITurnContext>();
            var turnStateMock = new Mock<TurnState>();
            var renderedPrompt = new RenderedPromptSection<string>(string.Empty, length: 256, tooLong: false);
            var promptMock = new Mock<Prompt>(new List<PromptSection>(), -1, true, "\n\n");
            promptMock.Setup((prompt) => prompt.RenderAsTextAsync(
                It.IsAny<ITurnContext>(), It.IsAny<IMemory>(), It.IsAny<IPromptFunctions<List<string>>>(),
                It.IsAny<ITokenizer>(), It.IsAny<int>(), It.IsAny<CancellationToken>())).ReturnsAsync(renderedPrompt);
            var promptTemplate = new PromptTemplate("test-prompt", promptMock.Object);
            var options = new AzureOpenAIModelOptions("test-key", "test-deployment", "https://test.openai.azure.com/")
            {
                CompletionType = CompletionConfiguration.CompletionType.Text,
                LogRequests = true
            };
            var clientMock = new Mock<OpenAIClient>();
            var response = new TestResponse(429, "exception");
            var exception = new RequestFailedException(response);
            clientMock.Setup((client) => client.GetCompletionsAsync(It.IsAny<CompletionsOptions>(), It.IsAny<CancellationToken>())).ThrowsAsync(exception);
            var openAIModel = new OpenAIModel(options, loggerFactory: new TestLoggerFactory());
            openAIModel.GetType().GetField("_openAIClient", BindingFlags.Instance | BindingFlags.NonPublic)!.SetValue(openAIModel, clientMock.Object);

            // Act
            var result = await openAIModel.CompletePromptAsync(turnContextMock.Object, turnStateMock.Object, new PromptManager(), new GPTTokenizer(), promptTemplate);

            // Assert
            Assert.Equal(PromptResponseStatus.RateLimited, result.Status);
            Assert.NotNull(result.Error);
            Assert.Equal("The text completion API returned a rate limit error.", result.Error.Message);
        }

        [Fact]
        public async void Test_CompletePromptAsync_AzureOpenAI_Text_RequestFailed()
        {
            // Arrange
            var turnContextMock = new Mock<ITurnContext>();
            var turnStateMock = new Mock<TurnState>();
            var renderedPrompt = new RenderedPromptSection<string>(string.Empty, length: 256, tooLong: false);
            var promptMock = new Mock<Prompt>(new List<PromptSection>(), -1, true, "\n\n");
            promptMock.Setup((prompt) => prompt.RenderAsTextAsync(
                It.IsAny<ITurnContext>(), It.IsAny<IMemory>(), It.IsAny<IPromptFunctions<List<string>>>(),
                It.IsAny<ITokenizer>(), It.IsAny<int>(), It.IsAny<CancellationToken>())).ReturnsAsync(renderedPrompt);
            var promptTemplate = new PromptTemplate("test-prompt", promptMock.Object);
            var options = new AzureOpenAIModelOptions("test-key", "test-deployment", "https://test.openai.azure.com/")
            {
                CompletionType = CompletionConfiguration.CompletionType.Text,
                LogRequests = true,
            };
            var clientMock = new Mock<OpenAIClient>();
            var response = new TestResponse(500, "exception");
            var exception = new RequestFailedException(response);
            clientMock.Setup((client) => client.GetCompletionsAsync(It.IsAny<CompletionsOptions>(), It.IsAny<CancellationToken>())).ThrowsAsync(exception);
            var openAIModel = new OpenAIModel(options, loggerFactory: new TestLoggerFactory());
            openAIModel.GetType().GetField("_openAIClient", BindingFlags.Instance | BindingFlags.NonPublic)!.SetValue(openAIModel, clientMock.Object);

            // Act
            var result = await openAIModel.CompletePromptAsync(turnContextMock.Object, turnStateMock.Object, new PromptManager(), new GPTTokenizer(), promptTemplate);

            // Assert
            Assert.Equal(PromptResponseStatus.Error, result.Status);
            Assert.NotNull(result.Error);
            Assert.True(result.Error.Message.StartsWith("The text completion API returned an error status of InternalServerError: Service request failed.\r\nStatus: 500 (exception)"));
        }

        [Fact]
        public async void Test_CompletePromptAsync_AzureOpenAI_Text()
        {
            // Arrange
            var turnContextMock = new Mock<ITurnContext>();
            var turnStateMock = new Mock<TurnState>();
            var renderedPrompt = new RenderedPromptSection<string>(string.Empty, length: 256, tooLong: false);
            var promptMock = new Mock<Prompt>(new List<PromptSection>(), -1, true, "\n\n");
            promptMock.Setup((prompt) => prompt.RenderAsTextAsync(
                It.IsAny<ITurnContext>(), It.IsAny<IMemory>(), It.IsAny<IPromptFunctions<List<string>>>(),
                It.IsAny<ITokenizer>(), It.IsAny<int>(), It.IsAny<CancellationToken>())).ReturnsAsync(renderedPrompt);
            var promptTemplate = new PromptTemplate("test-prompt", promptMock.Object);
            var options = new AzureOpenAIModelOptions("test-key", "test-deployment", "https://test.openai.azure.com/")
            {
                CompletionType = CompletionConfiguration.CompletionType.Text,
                LogRequests = true
            };
            var clientMock = new Mock<OpenAIClient>();
            var choice = CreateChoice("test-choice", 0, null, null, null, null);
            var usage = CreateCompletionsUsage(0, 0, 0);
            var completions = CreateCompletions("test-id", DateTimeOffset.UtcNow, new List<Choice> { choice }, usage);
            Response response = new TestResponse(200, string.Empty);
            clientMock.Setup((client) => client.GetCompletionsAsync(It.IsAny<CompletionsOptions>(), It.IsAny<CancellationToken>())).ReturnsAsync(Response.FromValue(completions, response));
            var openAIModel = new OpenAIModel(options, loggerFactory: new TestLoggerFactory());
            openAIModel.GetType().GetField("_openAIClient", BindingFlags.Instance | BindingFlags.NonPublic)!.SetValue(openAIModel, clientMock.Object);

            // Act
            var result = await openAIModel.CompletePromptAsync(turnContextMock.Object, turnStateMock.Object, new PromptManager(), new GPTTokenizer(), promptTemplate);

            // Assert
            Assert.Equal(PromptResponseStatus.Success, result.Status);
            Assert.NotNull(result.Message);
            Assert.Null(result.Error);
            Assert.Equal(ChatRole.Assistant, result.Message.Role);
            Assert.Equal("test-choice", result.Message.Content);
        }

        [Fact]
        public async void Test_CompletePromptAsync_AzureOpenAI_Chat_PromptTooLong()
        {
            // Arrange
            var turnContextMock = new Mock<ITurnContext>();
            var turnStateMock = new Mock<TurnState>();
            var renderedPrompt = new RenderedPromptSection<List<ChatMessage>>(new List<ChatMessage>(), length: 65536, tooLong: true);
            var promptMock = new Mock<Prompt>(new List<PromptSection>(), -1, true, "\n\n");
            promptMock.Setup((prompt) => prompt.RenderAsMessagesAsync(
                It.IsAny<ITurnContext>(), It.IsAny<IMemory>(), It.IsAny<IPromptFunctions<List<string>>>(),
                It.IsAny<ITokenizer>(), It.IsAny<int>(), It.IsAny<CancellationToken>())).ReturnsAsync(renderedPrompt);
            var promptTemplate = new PromptTemplate("test-prompt", promptMock.Object);
            var options = new AzureOpenAIModelOptions("test-key", "test-deployment", "https://test.openai.azure.com/")
            {
                CompletionType = CompletionConfiguration.CompletionType.Chat,
                LogRequests = true,
            };
            var openAIModel = new OpenAIModel(options, loggerFactory: new TestLoggerFactory());

            // Act
            var result = await openAIModel.CompletePromptAsync(turnContextMock.Object, turnStateMock.Object, new PromptManager(), new GPTTokenizer(), promptTemplate);

            // Assert
            Assert.Equal(PromptResponseStatus.TooLong, result.Status);
            Assert.NotNull(result.Error);
            Assert.Equal("The generated chat completion prompt had a length of 65536 tokens which exceeded the MaxInputTokens of 2048.", result.Error.Message);
        }

        [Fact]
        public async void Test_CompletePromptAsync_AzureOpenAI_Chat_RateLimited()
        {
            // Arrange
            var turnContextMock = new Mock<ITurnContext>();
            var turnStateMock = new Mock<TurnState>();
            var renderedPrompt = new RenderedPromptSection<List<ChatMessage>>(new List<ChatMessage>(), length: 256, tooLong: false);
            var promptMock = new Mock<Prompt>(new List<PromptSection>(), -1, true, "\n\n");
            promptMock.Setup((prompt) => prompt.RenderAsMessagesAsync(
                It.IsAny<ITurnContext>(), It.IsAny<IMemory>(), It.IsAny<IPromptFunctions<List<string>>>(),
                It.IsAny<ITokenizer>(), It.IsAny<int>(), It.IsAny<CancellationToken>())).ReturnsAsync(renderedPrompt);
            var promptTemplate = new PromptTemplate("test-prompt", promptMock.Object);
            var options = new AzureOpenAIModelOptions("test-key", "test-deployment", "https://test.openai.azure.com/")
            {
                CompletionType = CompletionConfiguration.CompletionType.Chat,
                LogRequests = true
            };
            var clientMock = new Mock<OpenAIClient>();
            var response = new TestResponse(429, "exception");
            var exception = new RequestFailedException(response);
            clientMock.Setup((client) => client.GetChatCompletionsAsync(It.IsAny<ChatCompletionsOptions>(), It.IsAny<CancellationToken>())).ThrowsAsync(exception);
            var openAIModel = new OpenAIModel(options, loggerFactory: new TestLoggerFactory());
            openAIModel.GetType().GetField("_openAIClient", BindingFlags.Instance | BindingFlags.NonPublic)!.SetValue(openAIModel, clientMock.Object);

            // Act
            var result = await openAIModel.CompletePromptAsync(turnContextMock.Object, turnStateMock.Object, new PromptManager(), new GPTTokenizer(), promptTemplate);

            // Assert
            Assert.Equal(PromptResponseStatus.RateLimited, result.Status);
            Assert.NotNull(result.Error);
            Assert.Equal("The chat completion API returned a rate limit error.", result.Error.Message);
        }

        [Fact]
        public async void Test_CompletePromptAsync_AzureOpenAI_Chat_RequestFailed()
        {
            // Arrange
            var turnContextMock = new Mock<ITurnContext>();
            var turnStateMock = new Mock<TurnState>();
            var renderedPrompt = new RenderedPromptSection<List<ChatMessage>>(new List<ChatMessage>(), length: 256, tooLong: false);
            var promptMock = new Mock<Prompt>(new List<PromptSection>(), -1, true, "\n\n");
            promptMock.Setup((prompt) => prompt.RenderAsMessagesAsync(
                It.IsAny<ITurnContext>(), It.IsAny<IMemory>(), It.IsAny<IPromptFunctions<List<string>>>(),
                It.IsAny<ITokenizer>(), It.IsAny<int>(), It.IsAny<CancellationToken>())).ReturnsAsync(renderedPrompt);
            var promptTemplate = new PromptTemplate("test-prompt", promptMock.Object);
            var options = new AzureOpenAIModelOptions("test-key", "test-deployment", "https://test.openai.azure.com/")
            {
                CompletionType = CompletionConfiguration.CompletionType.Chat,
                LogRequests = true
            };
            var clientMock = new Mock<OpenAIClient>();
            var response = new TestResponse(500, "exception");
            var exception = new RequestFailedException(response);
            clientMock.Setup((client) => client.GetChatCompletionsAsync(It.IsAny<ChatCompletionsOptions>(), It.IsAny<CancellationToken>())).ThrowsAsync(exception);
            var openAIModel = new OpenAIModel(options, loggerFactory: new TestLoggerFactory());
            openAIModel.GetType().GetField("_openAIClient", BindingFlags.Instance | BindingFlags.NonPublic)!.SetValue(openAIModel, clientMock.Object);

            // Act
            var result = await openAIModel.CompletePromptAsync(turnContextMock.Object, turnStateMock.Object, new PromptManager(), new GPTTokenizer(), promptTemplate);

            // Assert
            Assert.Equal(PromptResponseStatus.Error, result.Status);
            Assert.NotNull(result.Error);
            Assert.True(result.Error.Message.StartsWith("The chat completion API returned an error status of InternalServerError: Service request failed.\r\nStatus: 500 (exception)"));
        }

        [Fact]
        public async void Test_CompletePromptAsync_AzureOpenAI_Chat()
        {
            // Arrange
            var turnContextMock = new Mock<ITurnContext>();
            var turnStateMock = new Mock<TurnState>();
            var renderedPrompt = new RenderedPromptSection<List<ChatMessage>>(new List<ChatMessage>(), length: 256, tooLong: false);
            var promptMock = new Mock<Prompt>(new List<PromptSection>(), -1, true, "\n\n");
            promptMock.Setup((prompt) => prompt.RenderAsMessagesAsync(
                It.IsAny<ITurnContext>(), It.IsAny<IMemory>(), It.IsAny<IPromptFunctions<List<string>>>(),
                It.IsAny<ITokenizer>(), It.IsAny<int>(), It.IsAny<CancellationToken>())).ReturnsAsync(renderedPrompt);
            var promptTemplate = new PromptTemplate("test-prompt", promptMock.Object);
            var options = new AzureOpenAIModelOptions("test-key", "test-deployment", "https://test.openai.azure.com/")
            {
                CompletionType = CompletionConfiguration.CompletionType.Chat,
                LogRequests = true
            };
            var clientMock = new Mock<OpenAIClient>();
            var chatResponseMessage = CreateChatResponseMessage(Azure.AI.OpenAI.ChatRole.Assistant, "test-choice", null, null, null, null);
            var chatChoice = CreateChatChoice(chatResponseMessage, null, 0, null, null, null, null, null, null);
            var usage = CreateCompletionsUsage(0, 0, 0);
            var chatCompletions = CreateChatCompletions("test-id", DateTimeOffset.UtcNow, new List<ChatChoice> { chatChoice }, usage);
            Response response = new TestResponse(200, string.Empty);
            clientMock.Setup((client) => client.GetChatCompletionsAsync(It.IsAny<ChatCompletionsOptions>(), It.IsAny<CancellationToken>())).ReturnsAsync(Response.FromValue(chatCompletions, response!));
            var openAIModel = new OpenAIModel(options, loggerFactory: new TestLoggerFactory());
            openAIModel.GetType().GetField("_openAIClient", BindingFlags.Instance | BindingFlags.NonPublic)!.SetValue(openAIModel, clientMock.Object);

            // Act
            var result = await openAIModel.CompletePromptAsync(turnContextMock.Object, turnStateMock.Object, new PromptManager(), new GPTTokenizer(), promptTemplate);

            // Assert
            Assert.Equal(PromptResponseStatus.Success, result.Status);
            Assert.NotNull(result.Message);
            Assert.Null(result.Error);
            Assert.Equal(ChatRole.Assistant, result.Message.Role);
            Assert.Equal("test-choice", result.Message.Content);
        }

        private static Choice CreateChoice(string text, int index, ContentFilterResultsForChoice? contentFilterResults, CompletionsLogProbabilityModel? logProbabilityModel, CompletionsFinishReason? finishReason, IDictionary<string, BinaryData>? serializedAdditionalRawData)
        {
            Type[] paramTypes = new Type[] { typeof(string), typeof(int), typeof(ContentFilterResultsForChoice), typeof(CompletionsLogProbabilityModel), typeof(CompletionsFinishReason), typeof(IDictionary<string, BinaryData>) };
            object[] paramValues = new object[] { text, index, contentFilterResults!, logProbabilityModel!, finishReason!, serializedAdditionalRawData! };
            return Construct<Choice>(paramTypes, paramValues);
        }

        private static CompletionsUsage CreateCompletionsUsage(int completionTokens, int promptTokens, int totalTokens)
        {
            Type[] paramTypes = new Type[] { typeof(int), typeof(int), typeof(int) };
            object[] paramValues = new object[] { completionTokens, promptTokens, totalTokens };
            return Construct<CompletionsUsage>(paramTypes, paramValues);
        }

        private static Completions CreateCompletions(string id, DateTimeOffset created, IEnumerable<Choice> choices, CompletionsUsage usage)
        {
            Type[] paramTypes = new Type[] { typeof(string), typeof(DateTimeOffset), typeof(IEnumerable<Choice>), typeof(CompletionsUsage) };
            object[] paramValues = new object[] { id, created, choices, usage };
            return Construct<Completions>(paramTypes, paramValues);
        }

        private static ChatResponseMessage CreateChatResponseMessage(Azure.AI.OpenAI.ChatRole role, string content, IReadOnlyList<Azure.AI.OpenAI.ChatCompletionsToolCall>? toolCalls, Azure.AI.OpenAI.FunctionCall? functionCall, AzureChatExtensionsMessageContext? azureExtensionsContext, IDictionary<string, BinaryData>? serializedAdditionalRawData)
        {
            Type[] paramTypes = new Type[] { typeof(Azure.AI.OpenAI.ChatRole), typeof(string), typeof(IReadOnlyList<Azure.AI.OpenAI.ChatCompletionsToolCall>), typeof(Azure.AI.OpenAI.FunctionCall), typeof(AzureChatExtensionsMessageContext), typeof(IDictionary<string, BinaryData>) };
            object[] paramValues = new object[] { role, content, toolCalls!, functionCall!, azureExtensionsContext!, serializedAdditionalRawData! };
            return Construct<ChatResponseMessage>(paramTypes, paramValues);
        }

        private static ChatChoice CreateChatChoice(ChatResponseMessage message, ChatChoiceLogProbabilityInfo? logProbabilityInfo, int index, CompletionsFinishReason? finishReason, ChatFinishDetails? finishDetails, ChatResponseMessage? internalStreamingDeltaMessage, ContentFilterResultsForChoice? contentFilterResults, AzureChatEnhancements? enhancements, IDictionary<string, BinaryData>? serializedAdditionalRawData)
        {
            Type[] paramTypes = new Type[] { typeof(ChatResponseMessage), typeof(ChatChoiceLogProbabilityInfo), typeof(int), typeof(CompletionsFinishReason), typeof(ChatFinishDetails), typeof(ChatResponseMessage), typeof(ContentFilterResultsForChoice), typeof(AzureChatEnhancements), typeof(IDictionary<string, BinaryData>) };
            object[] paramValues = new object[] { message, logProbabilityInfo!, index, finishReason!, finishDetails!, internalStreamingDeltaMessage!, contentFilterResults!, enhancements!, serializedAdditionalRawData! };
            return Construct<ChatChoice>(paramTypes, paramValues);
        }

        private static ChatCompletions CreateChatCompletions(string id, DateTimeOffset created, IEnumerable<ChatChoice> choices, CompletionsUsage usage)
        {
            Type[] paramTypes = new Type[] { typeof(string), typeof(DateTimeOffset), typeof(IEnumerable<ChatChoice>), typeof(CompletionsUsage) };
            object[] paramValues = new object[] { id, created, choices, usage };
            return Construct<ChatCompletions>(paramTypes, paramValues);
        }

        private static T Construct<T>(Type[] paramTypes, object[] paramValues)
        {
            Type type = typeof(T);
            ConstructorInfo info = type.GetConstructor(BindingFlags.Instance | BindingFlags.NonPublic, null, paramTypes, null)!;

            return (T)info.Invoke(paramValues);
        }
    }

    public class TestResponse : Response
    {
        private readonly Dictionary<string, List<string>> _headers = new(StringComparer.OrdinalIgnoreCase);

        public TestResponse(int status, string reasonPhrase)
        {
            Status = status;
            ReasonPhrase = reasonPhrase;
            ClientRequestId = string.Empty;
        }

        public override int Status { get; }

        public override string ReasonPhrase { get; }

        public override Stream? ContentStream { get; set; }

        public override string ClientRequestId { get; set; }

        private bool? _isError;
        public override bool IsError => _isError ?? base.IsError;
        public void SetIsError(bool value)
        {
            _isError = value;
        }

        public bool IsDisposed { get; private set; }

        protected override bool TryGetHeader(string name, [NotNullWhen(true)] out string? value)
        {
            if (_headers.TryGetValue(name, out List<string>? values))
            {
                value = JoinHeaderValue(values);
                return true;
            }

            value = null;
            return false;
        }

        protected override bool TryGetHeaderValues(string name, [NotNullWhen(true)] out IEnumerable<string>? values)
        {
            var result = _headers.TryGetValue(name, out List<string>? valuesList);
            values = valuesList;
            return result;
        }

        protected override bool ContainsHeader(string name)
        {
            return TryGetHeaderValues(name, out _);
        }

        protected override IEnumerable<HttpHeader> EnumerateHeaders()
        {
            return _headers.Select(h => new HttpHeader(h.Key, JoinHeaderValue(h.Value)));
        }

        private static string JoinHeaderValue(IEnumerable<string> values)
        {
            return string.Join(",", values);
        }

        public override void Dispose()
        {
            IsDisposed = true;
        }
    }
}
