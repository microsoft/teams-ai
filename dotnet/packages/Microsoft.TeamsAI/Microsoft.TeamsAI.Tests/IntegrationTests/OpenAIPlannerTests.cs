using Microsoft.TeamsAI.AI;
using Microsoft.TeamsAI.AI.Moderator;
using Microsoft.TeamsAI.AI.Planner;
using Microsoft.TeamsAI.AI.Prompt;
using Microsoft.TeamsAI.Exceptions;
using Microsoft.Extensions.Configuration;
using Moq;
using System.Reflection;
using Xunit.Abstractions;
using Microsoft.TeamsAI.Tests.TestUtils;
using Microsoft.Bot.Builder;

namespace Microsoft.TeamsAI.Tests.IntegrationTests
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

            var directoryPath = Path.GetFullPath(Path.Combine(currentAssemblyDirectory, $"../../../IntegrationTests/"));
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
            Assert.NotNull(config.ApiKey);
            Assert.NotNull(config.ChatModelId);

            var options = new OpenAIPlannerOptions(config.ApiKey, config.ModelId);
            var planner = new OpenAIPlanner<TestTurnState>(options, _output);
            var moderatorMock = new Mock<IModerator<TestTurnState>>();

            var aiOptions = new AIOptions<TestTurnState>(planner, new PromptManager<TestTurnState>(), moderatorMock.Object);
            var turnContextMock = new Mock<ITurnContext>();
            var turnStateMock = new Mock<TestTurnState>();

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
            var planner = new OpenAIPlanner<TestTurnState>(options, _output);
            var moderatorMock = new Mock<IModerator<TestTurnState>>();

            var aiOptions = new AIOptions<TestTurnState>(planner, new PromptManager<TestTurnState>(), moderatorMock.Object);
            var turnContextMock = new Mock<ITurnContext>();
            var turnStateMock = new Mock<TestTurnState>();

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

        [Fact(Skip = "OpenAI will throttle requests. This test should only be run manually.")]
        public async Task OpenAIPlanner_CompletePromptAsync_Unauthorized()
        {
            // Arrange
            var config = _configuration.GetSection("OpenAI").Get<OpenAIConfiguration>();
            Assert.NotNull(config.ChatModelId);
            var invalidApiKey = "invalidApiKey";

            var options = new OpenAIPlannerOptions(invalidApiKey, config.ChatModelId);
            var planner = new OpenAIPlanner<TestTurnState>(options, _output);
            var moderatorMock = new Mock<IModerator<TestTurnState>>();

            var aiOptions = new AIOptions<TestTurnState>(planner, new PromptManager<TestTurnState>(), moderatorMock.Object);
            var turnContextMock = new Mock<ITurnContext>();
            var turnStateMock = new Mock<TestTurnState>();

            var promptTemplate = new PromptTemplate(
                "prompt",
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
            var exception = await Assert.ThrowsAsync<TeamsAIException>(async () => await planner.CompletePromptAsync(turnContextMock.Object, turnStateMock.Object, promptTemplate, aiOptions));

            // Assert
            Assert.Equal("Failed to perform AI prompt completion: Access denied: The request is not authorized, HTTP status: 401", exception.Message);
        }

        [Fact(Skip = "OpenAI will throttle requests. This test should only be run manually.")]
        public async Task OpenAIPlanner_CompletePromptAsync_InvalidModel_InvalidRequest()
        {
            // Arrange
            var config = _configuration.GetSection("OpenAI").Get<OpenAIConfiguration>();
            Assert.NotNull(config.ApiKey);

            var options = new OpenAIPlannerOptions(config.ApiKey, "invalidModel");
            var planner = new OpenAIPlanner<TestTurnState>(options, _output);
            var moderatorMock = new Mock<IModerator<TestTurnState>>();

            var aiOptions = new AIOptions<TestTurnState>(planner, new PromptManager<TestTurnState>(), moderatorMock.Object);
            var turnContextMock = new Mock<ITurnContext>();
            var turnStateMock = new Mock<TestTurnState>();

            var promptTemplate = new PromptTemplate(
                "prompt",
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
            var exception = await Assert.ThrowsAsync<TeamsAIException>(async () => await planner.CompletePromptAsync(turnContextMock.Object, turnStateMock.Object, promptTemplate, aiOptions));

            // Assert
            Assert.Equal("Failed to perform AI prompt completion: Invalid request: The request is not valid, HTTP status: 404", exception.Message);
        }
    }
}
