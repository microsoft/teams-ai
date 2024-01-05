using Azure;
using Azure.AI.OpenAI;
using Microsoft.Bot.Builder;
using Microsoft.Teams.AI.AI.Models;
using Microsoft.Teams.AI.AI.Prompts;
using Microsoft.Teams.AI.AI.Prompts.Sections;
using Microsoft.Teams.AI.AI.Tokenizers;
using Microsoft.Teams.AI.State;
using Moq;
using System.Reflection;
using ChatMessage = Microsoft.Teams.AI.AI.Models.ChatMessage;
using ChatRole = Microsoft.Teams.AI.AI.Models.ChatRole;

namespace Microsoft.Teams.AI.Tests.AITests
{
    public class OpenAIModelTests
    {
        [Fact]
        public void Test_Constructor_InvalidAzureEndpoint()
        {
            // Arrange
            var options = new AzureOpenAIModelOptions("test-key", "test-deployment", "https://test.openai.azure.com/");
            options.AzureEndpoint = "test-endpoint";

            // Act
            Exception exception = Assert.Throws<ArgumentException>(() => new OpenAIModel(options));

            // Assert
            Assert.Equal("Model created with an invalid endpoint of `test-endpoint`. The endpoint must be a valid HTTPS url.", exception.Message);
        }

        [Fact]
        public void Test_Constructor_InvalidAzureApiVersion()
        {
            // Arrange
            var options = new AzureOpenAIModelOptions("test-key", "test-deployment", "https://test.openai.azure.com/");
            var versions = new List<string>
            {
                "2022-12-01", "2023-05-15", "2023-06-01-preview", "2023-07-01-preview", "2023-08-01-preview", "2023-09-01-preview"
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
                CompletionType = CompletionConfiguration.CompletionType.Text
            };
            var openAIModel = new OpenAIModel(options);

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
                CompletionType = CompletionConfiguration.CompletionType.Text
            };
            var clientMock = new Mock<OpenAIClient>();
            var exception = new RequestFailedException(429, "exception");
            clientMock.Setup((client) => client.GetCompletionsAsync(It.IsAny<CompletionsOptions>(), It.IsAny<CancellationToken>())).ThrowsAsync(exception);
            var openAIModel = new OpenAIModel(options);
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
                CompletionType = CompletionConfiguration.CompletionType.Text
            };
            var clientMock = new Mock<OpenAIClient>();
            var exception = new RequestFailedException(500, "exception");
            clientMock.Setup((client) => client.GetCompletionsAsync(It.IsAny<CompletionsOptions>(), It.IsAny<CancellationToken>())).ThrowsAsync(exception);
            var openAIModel = new OpenAIModel(options);
            openAIModel.GetType().GetField("_openAIClient", BindingFlags.Instance | BindingFlags.NonPublic)!.SetValue(openAIModel, clientMock.Object);

            // Act
            var result = await openAIModel.CompletePromptAsync(turnContextMock.Object, turnStateMock.Object, new PromptManager(), new GPTTokenizer(), promptTemplate);

            // Assert
            Assert.Equal(PromptResponseStatus.Error, result.Status);
            Assert.NotNull(result.Error);
            Assert.Equal("The text completion API returned an error status of InternalServerError: exception", result.Error.Message);
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
                CompletionType = CompletionConfiguration.CompletionType.Text
            };
            var clientMock = new Mock<OpenAIClient>();
            var choice = CreateChoice("test-choice", 0, null, null);
            var usage = CreateCompletionsUsage(0, 0, 0);
            var completions = CreateCompletions("test-id", DateTimeOffset.UtcNow, new List<Choice> { choice }, usage);
            Response? response = null;
            clientMock.Setup((client) => client.GetCompletionsAsync(It.IsAny<CompletionsOptions>(), It.IsAny<CancellationToken>())).ReturnsAsync(Response.FromValue(completions, response!));
            var openAIModel = new OpenAIModel(options);
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
                CompletionType = CompletionConfiguration.CompletionType.Chat
            };
            var openAIModel = new OpenAIModel(options);

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
                CompletionType = CompletionConfiguration.CompletionType.Chat
            };
            var clientMock = new Mock<OpenAIClient>();
            var exception = new RequestFailedException(429, "exception");
            clientMock.Setup((client) => client.GetChatCompletionsAsync(It.IsAny<ChatCompletionsOptions>(), It.IsAny<CancellationToken>())).ThrowsAsync(exception);
            var openAIModel = new OpenAIModel(options);
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
                CompletionType = CompletionConfiguration.CompletionType.Chat
            };
            var clientMock = new Mock<OpenAIClient>();
            var exception = new RequestFailedException(500, "exception");
            clientMock.Setup((client) => client.GetChatCompletionsAsync(It.IsAny<ChatCompletionsOptions>(), It.IsAny<CancellationToken>())).ThrowsAsync(exception);
            var openAIModel = new OpenAIModel(options);
            openAIModel.GetType().GetField("_openAIClient", BindingFlags.Instance | BindingFlags.NonPublic)!.SetValue(openAIModel, clientMock.Object);

            // Act
            var result = await openAIModel.CompletePromptAsync(turnContextMock.Object, turnStateMock.Object, new PromptManager(), new GPTTokenizer(), promptTemplate);

            // Assert
            Assert.Equal(PromptResponseStatus.Error, result.Status);
            Assert.NotNull(result.Error);
            Assert.Equal("The chat completion API returned an error status of InternalServerError: exception", result.Error.Message);
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
                CompletionType = CompletionConfiguration.CompletionType.Chat
            };
            var clientMock = new Mock<OpenAIClient>();
            var chatChoice = CreateChatChoice(new Azure.AI.OpenAI.ChatMessage(Azure.AI.OpenAI.ChatRole.Assistant, "test-choice"), 0, null, null, null);
            var usage = CreateCompletionsUsage(0, 0, 0);
            var chatCompletions = CreateChatCompletions("test-id", DateTimeOffset.UtcNow, new List<ChatChoice> { chatChoice }, usage);
            Response? response = null;
            clientMock.Setup((client) => client.GetChatCompletionsAsync(It.IsAny<ChatCompletionsOptions>(), It.IsAny<CancellationToken>())).ReturnsAsync(Response.FromValue(chatCompletions, response!));
            var openAIModel = new OpenAIModel(options);
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

        private static Choice CreateChoice(string text, int index, CompletionsLogProbabilityModel? logProbabilityModel, CompletionsFinishReason finishReason)
        {
            Type[] paramTypes = new Type[] { typeof(string), typeof(int), typeof(CompletionsLogProbabilityModel), typeof(CompletionsFinishReason) };
            object[] paramValues = new object[] { text, index, logProbabilityModel!, finishReason };
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

        private static ChatChoice CreateChatChoice(Azure.AI.OpenAI.ChatMessage message, int index, CompletionsFinishReason? finishReason, Azure.AI.OpenAI.ChatMessage? internalStreamingDeltaMessage, ContentFilterResults? contentFilterResults)
        {
            Type[] paramTypes = new Type[] { typeof(Azure.AI.OpenAI.ChatMessage), typeof(int), typeof(CompletionsFinishReason), typeof(Azure.AI.OpenAI.ChatMessage), typeof(ContentFilterResults) };
            object[] paramValues = new object[] { message, index, finishReason!, internalStreamingDeltaMessage!, contentFilterResults! };
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
}
