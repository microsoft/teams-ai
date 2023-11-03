using Microsoft.Teams.AI.AI.Moderator;
using Microsoft.Teams.AI.AI.Planner;
using Microsoft.Teams.AI.AI.Prompt;
using Microsoft.Teams.AI.AI;
using Microsoft.Extensions.Configuration;
using Moq;
using System.Reflection;
using Xunit.Abstractions;
using Microsoft.Bot.Schema;
using Microsoft.Teams.AI.State;
using Microsoft.Bot.Builder;
using Microsoft.Teams.AI.Tests.TestUtils;
using Microsoft.Extensions.Logging;

namespace Microsoft.Teams.AI.Tests.IntegrationTests
{
    public sealed class OpenAIModeratorTests
    {
        private readonly IConfigurationRoot _configuration;
        private readonly RedirectOutput _output;
        private readonly ILoggerFactory _loggerFactory;

        public OpenAIModeratorTests(ITestOutputHelper output)
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
                .AddUserSecrets<AzureOpenAICompletionTests>()
                .Build();
        }

        // TODO: There exists a race condition bug where this test fails when running the entire test suite, but not when run in isolation.
        [Theory(Skip = "This test should only be run manually.")]
        [InlineData("I want to kill them.", true)]
        public async Task OpenAIModerator_ReviewPrompt(string input, bool flagged)
        {
            // Arrange
            var config = _configuration.GetSection("OpenAI").Get<OpenAIConfiguration>();
            var options = new OpenAIModeratorOptions(config.ApiKey, ModerationType.Both);
            var moderator = new OpenAIModerator<TurnState>(options, _loggerFactory);

            var botAdapterMock = new Mock<BotAdapter>();
            // TODO: when TurnState is implemented, get the user input
            var activity = new Activity()
            {
                Text = input,
            };
            var turnContext = new TurnContext(botAdapterMock.Object, activity);
            var turnStateMock = new Mock<TurnState>();
            var promptTemplateMock = new Mock<PromptTemplate>(string.Empty, new PromptTemplateConfiguration());

            // Act
            var result = await moderator.ReviewPrompt(turnContext, turnStateMock.Object, promptTemplateMock.Object);

            // Assert
            if (flagged)
            {
                Assert.NotNull(result);
                Assert.Equal(AIConstants.DoCommand, result.Commands[0].Type);
                Assert.Equal(AIConstants.FlaggedInputActionName, ((PredictedDoCommand)result.Commands[0]).Action);
            }
            else
            {
                Assert.Null(result);
            }
        }

        [Theory(Skip = "This test should only be run manually.")]
        [InlineData("I want to kill them.", true)]
        public async Task OpenAIModerator_ReviewPlan(string response, bool flagged)
        {
            // Arrange
            var config = _configuration.GetSection("OpenAI").Get<OpenAIConfiguration>();
            var options = new OpenAIModeratorOptions(config.ApiKey, ModerationType.Both);
            var moderator = new OpenAIModerator<TurnState>(options, _loggerFactory);

            var turnContextMock = new Mock<ITurnContext>();
            var turnStateMock = new Mock<TurnState>();
            var plan = new Plan(new List<IPredictedCommand>()
            {
                new PredictedSayCommand(response)
            });

            // Act
            var result = await moderator.ReviewPlan(turnContextMock.Object, turnStateMock.Object, plan);

            // Assert
            if (flagged)
            {
                Assert.Equal(AIConstants.DoCommand, result.Commands[0].Type);
                Assert.Equal(AIConstants.FlaggedOutputActionName, ((PredictedDoCommand)result.Commands[0]).Action);
            }
            else
            {
                Assert.Equal(AIConstants.SayCommand, result.Commands[0].Type);
            }
        }
    }
}
