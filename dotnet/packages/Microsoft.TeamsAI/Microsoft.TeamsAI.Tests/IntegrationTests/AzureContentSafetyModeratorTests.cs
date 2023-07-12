﻿using Microsoft.TeamsAI.AI.Moderator;
using Microsoft.TeamsAI.AI.Planner;
using Microsoft.TeamsAI.AI.Prompt;
using Microsoft.TeamsAI.AI;
using Microsoft.Extensions.Configuration;
using Moq;
using System.Reflection;
using Xunit.Abstractions;
using Microsoft.TeamsAI.AI.Action;
using Microsoft.Bot.Schema;
using Microsoft.TeamsAI.State;
using Microsoft.Bot.Builder;

namespace Microsoft.TeamsAI.Tests.Integration
{
    public sealed class AzureContentSafetyModeratorTests
    {
        private readonly IConfigurationRoot _configuration;
        private readonly RedirectOutput _output;

        public AzureContentSafetyModeratorTests(ITestOutputHelper output)
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
        [InlineData("I hate you", true)]
        [InlineData("Turn on the light", false)]
        [InlineData("我恨你", true)]
        [InlineData("電気をつける", false)]
        public async Task AzureContentSafetyModerator_ReviewPrompt(string input, bool flagged)
        {
            // Arrange
            var config = _configuration.GetSection("AzureContentSafety").Get<AzureContentSafetyConfiguration>();
            var options = new AzureContentSafetyModeratorOptions(config.ApiKey, config.Endpoint, ModerationType.Both);
            var moderator = new AzureContentSafetyModerator<TurnState>(options, _output);

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
        [InlineData("I hate you", true)]
        [InlineData("The light is turned on", false)]
        public async Task AzureContentSafetyModerator_ReviewPlan(string response, bool flagged)
        {
            // Arrange
            var config = _configuration.GetSection("AzureContentSafety").Get<AzureContentSafetyConfiguration>();
            var options = new AzureContentSafetyModeratorOptions(config.ApiKey, config.Endpoint, ModerationType.Both);
            var moderator = new AzureContentSafetyModerator<TurnState>(options, _output);

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
