using Azure;
using Microsoft.Bot.Builder;
using Microsoft.Teams.AI.Tests.TestUtils;
using Moq;
using System.Reflection;
using Microsoft.Teams.AI.AI.Embeddings;
using Azure.AI.OpenAI;
using Microsoft.Teams.AI.Exceptions;

#pragma warning disable CS8604 // Possible null reference argument.
namespace Microsoft.Teams.AI.Tests.AITests
{
    public class OpenAIEmbeddingsTests
    {
        [Fact]
        public async void Test_OpenAI_CreateEmbeddings_ReturnEmbeddings()
        {
            // Arrange
            var apiKey = "randomApiKey";
            var model = "randomModelId";

            var options = new OpenAIEmbeddingsOptions(apiKey, model);
            var turnContextMock = new Mock<ITurnContext>();
            var turnStateMock = new Mock<TestTurnState>();
            var openAiEmbeddings = new OpenAIEmbeddings<TestTurnState, OpenAIEmbeddingsOptions>(options);

            IList<string> inputs = new List<string> { "test" };
            var clientMock = new Mock<OpenAIClient>(It.IsAny<string>());
            IEnumerable<EmbeddingItem> data = new List<EmbeddingItem>()
            {
                AzureOpenAIModelFactory.EmbeddingItem()
            };
            EmbeddingsUsage usage = AzureOpenAIModelFactory.EmbeddingsUsage();
            Embeddings embeddingsResult = AzureOpenAIModelFactory.Embeddings(data, usage);
            Response? response = null;
            clientMock.Setup(client => client.GetEmbeddingsAsync(It.IsAny<EmbeddingsOptions>(), It.IsAny<CancellationToken>())).ReturnsAsync(Response.FromValue(embeddingsResult, response));
            openAiEmbeddings.GetType().GetField("_client", BindingFlags.Instance | BindingFlags.NonPublic)!.SetValue(openAiEmbeddings, clientMock.Object);

            // Act
            var result = await openAiEmbeddings.CreateEmbeddingsAsync(inputs);

            // Assert
            Assert.NotNull(result);
            Assert.NotNull(result.Output);
            Assert.Equal(result.Status, EmbeddingsResponseStatus.Success);
        }

        [Fact]
        public async void Test_AzureOpenAI_CreateEmbeddings_ReturnEmbeddings()
        {
            // Arrange
            var apiKey = "randomApiKey";
            var model = "randomModelId";
            var endpoint = "https://test.cognitiveservices.azure.com";
            var options = new AzureOpenAIEmbeddingsOptions(apiKey, model, endpoint);

            var turnContextMock = new Mock<ITurnContext>();
            var turnStateMock = new Mock<TestTurnState>();
            var openAiEmbeddings = new OpenAIEmbeddings<TestTurnState, AzureOpenAIEmbeddingsOptions>(options);

            IList<string> inputs = new List<string> { "test" };
            IEnumerable<EmbeddingItem> data = new List<EmbeddingItem>()
            {
                AzureOpenAIModelFactory.EmbeddingItem()
            };
            EmbeddingsUsage usage = AzureOpenAIModelFactory.EmbeddingsUsage();
            Embeddings embeddingsResult = AzureOpenAIModelFactory.Embeddings(data, usage);
            Response? response = null;
            var clientMock = new Mock<OpenAIClient>(It.IsAny<string>());
            clientMock.Setup(client => client.GetEmbeddingsAsync(It.IsAny<EmbeddingsOptions>(), It.IsAny<CancellationToken>())).ReturnsAsync(Response.FromValue(embeddingsResult, response));
            openAiEmbeddings.GetType().GetField("_client", BindingFlags.Instance | BindingFlags.NonPublic)!.SetValue(openAiEmbeddings, clientMock.Object);

            // Act
            var result = await openAiEmbeddings.CreateEmbeddingsAsync(inputs);

            // Assert
            Assert.NotNull(result);
            Assert.NotNull(result.Output);
            Assert.Equal(result.Status, EmbeddingsResponseStatus.Success);
        }

        [Theory]
        [InlineData(429, "too many requests", EmbeddingsResponseStatus.RateLimited)]
        [InlineData(502, "service error", EmbeddingsResponseStatus.Failure)]
        public async void Test_CreateEmbeddings_ThrowRequestFailedException(int statusCode, string errorMsg, EmbeddingsResponseStatus responseStatus)
        {
            // Arrange
            var apiKey = "randomApiKey";
            var model = "randomModelId";

            var options = new OpenAIEmbeddingsOptions(apiKey, model);
            var turnContextMock = new Mock<ITurnContext>();
            var turnStateMock = new Mock<TestTurnState>();
            var openAiEmbeddings = new OpenAIEmbeddings<TestTurnState, OpenAIEmbeddingsOptions>(options);

            IList<string> inputs = new List<string> { "test" };
            var exception = new RequestFailedException(statusCode, errorMsg);
            var clientMock = new Mock<OpenAIClient>(It.IsAny<string>());
            clientMock.Setup(client => client.GetEmbeddingsAsync(It.IsAny<EmbeddingsOptions>(), It.IsAny<CancellationToken>())).ThrowsAsync(exception);
            openAiEmbeddings.GetType().GetField("_client", BindingFlags.Instance | BindingFlags.NonPublic)!.SetValue(openAiEmbeddings, clientMock.Object);

            // Act
            var result = await openAiEmbeddings.CreateEmbeddingsAsync(inputs);

            // Assert
            Assert.NotNull(result);
            Assert.Null(result.Output);
            Assert.Equal(result.Status, responseStatus);
        }

        [Fact]
        public async void Test_CreateEmbeddings_ThrowException()
        {
            // Arrange
            var apiKey = "randomApiKey";
            var model = "randomModelId";

            var options = new OpenAIEmbeddingsOptions(apiKey, model);
            var turnContextMock = new Mock<ITurnContext>();
            var turnStateMock = new Mock<TestTurnState>();
            var openAiEmbeddings = new OpenAIEmbeddings<TestTurnState, OpenAIEmbeddingsOptions>(options);

            IList<string> inputs = new List<string> { "test" };
            var exception = new InvalidOperationException("other exception");
            var clientMock = new Mock<OpenAIClient>(It.IsAny<string>());
            clientMock.Setup(client => client.GetEmbeddingsAsync(It.IsAny<EmbeddingsOptions>(), It.IsAny<CancellationToken>())).ThrowsAsync(exception);
            openAiEmbeddings.GetType().GetField("_client", BindingFlags.Instance | BindingFlags.NonPublic)!.SetValue(openAiEmbeddings, clientMock.Object);

            // Act
            var result = await Assert.ThrowsAsync<TeamsAIException>(async () => await openAiEmbeddings.CreateEmbeddingsAsync(inputs));

            // Assert
            Assert.Equal("Error while executing openAI Embeddings execution: other exception", result.Message);
        }
    }
}
#pragma warning restore CS8604 // Possible null reference argument.
