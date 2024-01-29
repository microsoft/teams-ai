using Microsoft.Extensions.Configuration;
using Microsoft.Teams.AI.AI.Embeddings;
using Microsoft.Teams.AI.State;
using Microsoft.Teams.AI.Tests.TestUtils;
using System.Reflection;
using Xunit.Abstractions;
using Microsoft.Extensions.Logging;

namespace Microsoft.Teams.AI.Tests.IntegrationTests
{
    public sealed class OpenAIEmbeddingsTests
    {
        private readonly IConfigurationRoot _configuration;
        private readonly RedirectOutput _output;
        private readonly ILoggerFactory _loggerFactory;

        public OpenAIEmbeddingsTests(ITestOutputHelper output)
        {
            _output = new RedirectOutput(output);
            _loggerFactory = new TestLoggerFactory(_output);

            var currentAssemblyDirectory = Path.GetDirectoryName(Assembly.GetExecutingAssembly().Location);

            if (string.IsNullOrWhiteSpace(currentAssemblyDirectory))
            {
                throw new InvalidOperationException("Unable to determine current assembly directory.");
            }

            var directoryPath = Path.GetFullPath(Path.Combine(currentAssemblyDirectory, $"../../../IntegrationTests/"));
            var settingsPath = Path.Combine(directoryPath, "testsettings.json");

            _configuration = new ConfigurationBuilder()
                .AddJsonFile(path: settingsPath, optional: false, reloadOnChange: true)
                .AddEnvironmentVariables()
                .AddUserSecrets<OpenAIEmbeddingsTests>()
                .Build();
        }

        [Theory(Skip = "This test should only be run manually.")]
        public async Task Test_CreateEmbeddingsAsync_OpenAI()
        {
            // Arrange
            var config = _configuration.GetSection("OpenAI").Get<OpenAIConfiguration>();
            var options = new OpenAIEmbeddingsOptions(config.ApiKey, config.EmbeddingModelId!);
            var embeddings = new OpenAIEmbeddings<TurnState, OpenAIEmbeddingsOptions>(options, _loggerFactory);
            var inputs = new List<string>()
            {
                "test-input1",
                "test-input2"
            };
            var dimension = config.EmbeddingModelId!.Equals("text-embedding-3-large") ? 3072 : 1536;

            // Act
            var result = await embeddings.CreateEmbeddingsAsync(inputs);

            // Assert
            Assert.Equal(EmbeddingsResponseStatus.Success, result.Status);
            Assert.NotNull(result.Output);
            Assert.Equal(2, result.Output.Count);
            Assert.Equal(dimension, result.Output[0].Length);
            Assert.Equal(dimension, result.Output[1].Length);
        }

        [Theory(Skip = "This test should only be run manually.")]
        public async Task Test_CreateEmbeddingsAsync_AzureOpenAI()
        {
            // Arrange
            var config = _configuration.GetSection("AzureOpenAI").Get<AzureOpenAIConfiguration>();
            var options = new AzureOpenAIEmbeddingsOptions(config.ApiKey, config.EmbeddingModelId!, config.Endpoint);
            var embeddings = new OpenAIEmbeddings<TurnState, AzureOpenAIEmbeddingsOptions>(options, _loggerFactory);
            var inputs = new List<string>()
            {
                "test-input1",
                "test-input2"
            };
            var dimension = config.EmbeddingModelId!.Equals("text-embedding-3-large") ? 3072 : 1536;

            // Act
            var result = await embeddings.CreateEmbeddingsAsync(inputs);

            // Assert
            Assert.Equal(EmbeddingsResponseStatus.Success, result.Status);
            Assert.NotNull(result.Output);
            Assert.Equal(2, result.Output.Count);
            Assert.Equal(dimension, result.Output[0].Length);
            Assert.Equal(dimension, result.Output[1].Length);
        }
    }
}
