using Microsoft.Bot.Builder;
using Microsoft.Extensions.Configuration;
using Microsoft.Teams.AI.State;
using Microsoft.Teams.AI.Tests.TestUtils;
using Moq;
using System.Reflection;
using Xunit.Abstractions;
using Microsoft.Extensions.Logging;
using Microsoft.Bot.Schema;
using Microsoft.Teams.AI.AI.Tokenizers;
using Microsoft.Teams.AI.AI.Prompts;
using Microsoft.Teams.AI.AI.Prompts.Sections;

namespace Microsoft.Teams.AI.Tests.IntegrationTests
{
    public sealed class OpenAIModelTests
    {
        private readonly IConfigurationRoot _configuration;
        private readonly RedirectOutput _output;
        private readonly ILoggerFactory _loggerFactory;

        public OpenAIModelTests(ITestOutputHelper output)
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
                .AddUserSecrets<OpenAIModelTests>()
                .Build();
        }

        [Theory(Skip = "Should only run manually for now.")]
        [InlineData("What is the capital of Thailand?", "Bangkok")]
        public async Task OpenAIModel_CompletePrompt(string input, string expectedAnswer)
        {
            // Arrange
            var config = _configuration.GetSection("OpenAI").Get<OpenAIConfiguration>();
            var modelOptions = new AI.Models.OpenAIModelOptions(config.ApiKey, config.ChatModelId!);
            var model = new AI.Models.OpenAIModel(modelOptions);

            var botAdapterMock = new Mock<BotAdapter>();
            var activity = new Activity()
            {
                Text = input,
            };
            var turnContext = new TurnContext(botAdapterMock.Object, activity);
            var memory = new TurnState();
            var promptManager = new PromptManager(new PromptManagerOptions());
            var tokenizer = new GPTTokenizer();
            var promptTemplate = new PromptTemplate("test", new Prompt(new List<PromptSection> { new UserMessageSection(input) }));

            // Act
            var result = await model.CompletePromptAsync(turnContext, memory, promptManager, tokenizer, promptTemplate);

            // Assert
            Assert.Equal(PromptResponseStatus.Success, result.Status);
            Assert.Contains(expectedAnswer, result.Message!.GetContent<string>());
        }
    }
}
