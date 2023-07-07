using Microsoft.Bot.Builder.M365.AI.Action;
using Microsoft.Bot.Builder.M365.AI.Moderator;
using Microsoft.Bot.Builder.M365.AI.Planner;
using Microsoft.Bot.Builder.M365.AI.Prompt;
using Microsoft.Bot.Builder.M365.AI;
using Microsoft.Bot.Builder.M365.Tests.Integration;
using Microsoft.Extensions.Configuration;
using Moq;
using System.Reflection;
using Xunit.Abstractions;
using Microsoft.Bot.Schema;

namespace Microsoft.Bot.Builder.M365.Tests.IntegrationTests
{
    public sealed class OpenAIModeratorTests
    {
        private readonly IConfigurationRoot _configuration;
        private readonly RedirectOutput _output;

        public OpenAIModeratorTests(ITestOutputHelper output)
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
                .AddUserSecrets<AzureOpenAICompletionTests>()
                .Build();
        }

        [Theory(Skip = "This test should only be run manually.")]
        [InlineData("I want to kill them.", true)]
        public async Task OpenAIModerator_ReviewPrompt(string input, bool flagged)
        {
            // Arrange
            var config = _configuration.GetSection("OpenAI").Get<OpenAIConfiguration>();
            var options = new OpenAIModeratorOptions(config.ApiKey, ModerationType.Both);
            var moderator = new OpenAIModerator<TurnState>(options, _output);

            var botAdapterMock = new Mock<BotAdapter>();
            // TODO: when TurnState is implemented, get the user input
            var activity = new Activity()
            {
                Text = input,
            };
            var turnContext = new TurnContext(botAdapterMock.Object, activity);
            var turnStateMock = new Mock<TurnState>();
            var promptTemplateMock = new Mock<PromptTemplate>(String.Empty, new PromptTemplateConfiguration());

            // Act
            var result = await moderator.ReviewPrompt(turnContext, turnStateMock.Object, promptTemplateMock.Object);

            // Assert
            if (flagged)
            {
                Assert.NotNull(result);
                Assert.Equal(AITypes.DoCommand, result.Commands[0].Type);
                Assert.Equal(DefaultActionTypes.FlaggedInputActionName, ((PredictedDoCommand)result.Commands[0]).Action);
            }
            else
            {
                Assert.Null(result);
            }
        }

        [Theory(Skip = "This test should only be run manually.")]
        [InlineData("I want to kill them.", true)]
        public async Task AzureContentSafetyModerator_ReviewPlan(string response, bool flagged)
        {
            // Arrange
            var config = _configuration.GetSection("OpenAI").Get<OpenAIConfiguration>();
            var options = new OpenAIModeratorOptions(config.ApiKey, ModerationType.Both);
            var moderator = new OpenAIModerator<TurnState>(options, _output);

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
                Assert.Equal(AITypes.DoCommand, result.Commands[0].Type);
                Assert.Equal(DefaultActionTypes.FlaggedOutputActionName, ((PredictedDoCommand)result.Commands[0]).Action);
            }
            else
            {
                Assert.Equal(AITypes.SayCommand, result.Commands[0].Type);
            }
        }
    }
}
