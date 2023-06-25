using Microsoft.Bot.Builder.M365.AI;
using Microsoft.Bot.Builder.M365.AI.Planner;
using Microsoft.Bot.Builder.M365.AI.Prompt;
using Microsoft.Extensions.Configuration;
using Moq;
using System.Reflection;
using Xunit.Abstractions;

namespace Microsoft.Bot.Builder.M365.Tests.Integration
{
    public sealed class OpenAICompletionTests
    {
        private readonly IConfigurationRoot _configuration;
        private readonly RedirectOutput _output;

        public OpenAICompletionTests(ITestOutputHelper output)
        {
            _output = new RedirectOutput(output);

            var currentAssemblyDirectory = Path.GetDirectoryName(Assembly.GetExecutingAssembly().Location);

            if (string.IsNullOrWhiteSpace(currentAssemblyDirectory))
            {
                throw new InvalidOperationException("Unable to determine current assembly directory.");
            }

            var directoryPath = Path.GetFullPath(Path.Combine(currentAssemblyDirectory, $"../../../Integration/"));
            var settingsPath = Path.Combine(directoryPath, "testsettings.json");

            _configuration = new ConfigurationBuilder()
                .AddJsonFile(path: settingsPath, optional: false, reloadOnChange: true)
                .AddEnvironmentVariables()
                .AddUserSecrets<OpenAICompletionTests>()
                .Build();
        }

        [Theory(Skip = "OpenAI will throttle requests. This test should only be run manually.")]
        [InlineData("What is the capital city of Thailand?", "Bangkok")]
        public async Task OpenAIPlanner_CompletePromptAsync_TextCompletion(string prompt, string expectedAnswerContains)
        {
            // Arrange
            var config = _configuration.GetSection("OpenAI").Get<OpenAIConfiguration>();
            var options = new OpenAIPlannerOptions(config.ApiKey, config.ModelId);
            var planner = new OpenAIPlanner<TurnState, OpenAIPlannerOptions>(options, _output);

            var aiOptions = new AIOptions<TurnState>(planner, new PromptManager<TurnState>(), new Moderator<TurnState>());
            var turnContextMock = new Mock<ITurnContext>();
            var turnStateMock = new Mock<TurnState>();

            var promptTemplate = new PromptTemplate(
                prompt,
                new PromptTemplateConfiguration
                {
                    Completion =
                        {
                            MaxTokens = 2000,
                            Temperature = 0.2,
                            TopP = 0.5,
                        }
                }
            );

            // Act
            var result = await planner.CompletePromptAsync(turnContextMock.Object, turnStateMock.Object, promptTemplate, aiOptions);
            _output.WriteLine($"Model result: ${result}");

            // Assert
            Assert.Contains(expectedAnswerContains, result, StringComparison.OrdinalIgnoreCase);

            /// Logs contain string "PROMPT" to indicate standard text completion
            Assert.Contains("PROMPT", _output.GetLogs());
        }

        [Theory(Skip = "OpenAI will throttle requests. This test should only be run manually.")]
        [InlineData("What city is the capital of British Columbia, Canada?", "Victoria")]
        public async Task OpenAIPlanner_CompletePromptAsync_ChatCompletion(string prompt, string expectedAnswerContains)
        {
            // Arrange
            var config = _configuration.GetSection("OpenAI").Get<OpenAIConfiguration>();
            Assert.NotNull(config.ApiKey);
            Assert.NotNull(config.ChatModelId);

            var options = new OpenAIPlannerOptions(config.ApiKey, config.ChatModelId);
            var planner = new OpenAIPlanner<TurnState, OpenAIPlannerOptions>(options, _output);

            var aiOptions = new AIOptions<TurnState>(planner, new PromptManager<TurnState>(), new Moderator<TurnState>());
            var turnContextMock = new Mock<ITurnContext>();
            var turnStateMock = new Mock<TurnState>();

            var promptTemplate = new PromptTemplate(
                prompt,
                new PromptTemplateConfiguration
                {
                    Completion =
                        {
                            MaxTokens = 2000,
                            Temperature = 0.2,
                            TopP = 0.5,
                        }
                }
            );

            // Act
            var result = await planner.CompletePromptAsync(turnContextMock.Object, turnStateMock.Object, promptTemplate, aiOptions);

            // Assert
            Assert.Contains(expectedAnswerContains, result, StringComparison.OrdinalIgnoreCase);
            /// Logs contain string "CHAT" to indicate chat completion
            Assert.Contains("CHAT", _output.GetLogs());
        }
    }
}
