using Moq;
using System.Reflection;
using Microsoft.Teams.AI.AI.Embeddings;
using OpenAI.Embeddings;
using OpenAI;
using Microsoft.Teams.AI.Exceptions;
using System.ClientModel;
using Microsoft.Teams.AI.Tests.TestUtils;
using System.ClientModel.Primitives;

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
            var openAiEmbeddings = new OpenAIEmbeddings(options);

            IList<string> inputs = new List<string> { "test" };
            var clientMock = new Mock<OpenAIClient>(new ApiKeyCredential(apiKey), It.IsAny<OpenAIClientOptions>());
            var response = new TestResponse(200, string.Empty);
            var embeddingCollection = ModelReaderWriter.Read<EmbeddingCollection>(BinaryData.FromString(@"{
                ""data"": [
                    {
                        ""object"": ""embedding"",
                        ""index"": 0,
                        ""embedding"": ""MC4wMDIzMDY0MjU1""
                    }
                ]
            }"));
            // MC4wMDIzMDY0MjU1= the base64 encoded float 0.0023064255
            clientMock.Setup(client => client
                .GetEmbeddingClient(It.IsAny<string>())
                .GenerateEmbeddingsAsync(It.IsAny<IEnumerable<string>>(), It.IsAny<EmbeddingGenerationOptions>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(ClientResult.FromValue(embeddingCollection, response));
            openAiEmbeddings.GetType().GetField("_openAIClient", BindingFlags.Instance | BindingFlags.NonPublic)!.SetValue(openAiEmbeddings, clientMock.Object);

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

            var openAiEmbeddings = new OpenAIEmbeddings(options);

            IList<string> inputs = new List<string> { "test" };
            var clientMock = new Mock<OpenAIClient>(new ApiKeyCredential(apiKey), It.IsAny<OpenAIClientOptions>());
            var response = new TestResponse(200, string.Empty);
            var embeddingCollection = ModelReaderWriter.Read<EmbeddingCollection>(BinaryData.FromString(@"{
                ""data"": [
                    {
                        ""object"": ""embedding"",
                        ""index"": 0,
                        ""embedding"": ""MC4wMDIzMDY0MjU1""
                    }
                ]
            }"));
            // MC4wMDIzMDY0MjU1= the base64 encoded float 0.0023064255
            clientMock.Setup(client => client
                .GetEmbeddingClient(It.IsAny<string>())
                .GenerateEmbeddingsAsync(It.IsAny<IEnumerable<string>>(), It.IsAny<EmbeddingGenerationOptions>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(ClientResult.FromValue(embeddingCollection, response));
            openAiEmbeddings.GetType().GetField("_openAIClient", BindingFlags.Instance | BindingFlags.NonPublic)!.SetValue(openAiEmbeddings, clientMock.Object);

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
        public async void Test_CreateEmbeddings_ThrowClientResultException(int statusCode, string errorMsg, EmbeddingsResponseStatus responseStatus)
        {
            // Arrange
            var apiKey = "randomApiKey";
            var model = "randomModelId";

            var options = new OpenAIEmbeddingsOptions(apiKey, model);
            var openAiEmbeddings = new OpenAIEmbeddings(options);

            IList<string> inputs = new List<string> { "test" };
            var clientMock = new Mock<OpenAIClient>(new ApiKeyCredential(apiKey), It.IsAny<OpenAIClientOptions>());
            var response = new TestResponse(statusCode, errorMsg);
            clientMock.Setup(client => client
                .GetEmbeddingClient(It.IsAny<string>())
                .GenerateEmbeddingsAsync(It.IsAny<IEnumerable<string>>(), It.IsAny<EmbeddingGenerationOptions>(), It.IsAny<CancellationToken>()))
                .ThrowsAsync(new ClientResultException(response));
            openAiEmbeddings.GetType().GetField("_openAIClient", BindingFlags.Instance | BindingFlags.NonPublic)!.SetValue(openAiEmbeddings, clientMock.Object);

            // Act
            var result = await openAiEmbeddings.CreateEmbeddingsAsync(inputs);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(responseStatus, result.Status);
            Assert.Null(result.Output);
        }

        [Fact]
        [System.Diagnostics.CodeAnalysis.SuppressMessage("Usage", "CA2201:Do not raise reserved exception types", Justification = "<Pending>")]
        public async void Test_CreateEmbeddings_ThrowException()
        {
            // Arrange
            var apiKey = "randomApiKey";
            var model = "randomModelId";

            var options = new OpenAIEmbeddingsOptions(apiKey, model);
            var openAiEmbeddings = new OpenAIEmbeddings(options);

            IList<string> inputs = new List<string> { "test" };
            var clientMock = new Mock<OpenAIClient>(new ApiKeyCredential(apiKey), It.IsAny<OpenAIClientOptions>());
            clientMock.Setup(client => client
                .GetEmbeddingClient(It.IsAny<string>())
                .GenerateEmbeddingsAsync(It.IsAny<IEnumerable<string>>(), It.IsAny<EmbeddingGenerationOptions>(), It.IsAny<CancellationToken>()))
                .ThrowsAsync(new Exception("test-exception"));
            openAiEmbeddings.GetType().GetField("_openAIClient", BindingFlags.Instance | BindingFlags.NonPublic)!.SetValue(openAiEmbeddings, clientMock.Object);

            // Act
            var exception = await Assert.ThrowsAsync<TeamsAIException>(async () => await openAiEmbeddings.CreateEmbeddingsAsync(inputs));

            // Assert
            Assert.NotNull(exception);
            Assert.Equal("Error while executing openAI Embeddings execution: test-exception", exception.Message);
        }
    }
}
#pragma warning restore CS8604 // Possible null reference argument.
