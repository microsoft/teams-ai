using Castle.Core.Logging;
using Microsoft.Teams.AI.AI;
using Microsoft.Teams.AI.AI.Moderator;
using Microsoft.Teams.AI.AI.Planners;
using Microsoft.Teams.AI.AI.Prompts;
using Microsoft.Teams.AI.Exceptions;
using Microsoft.Bot.Schema;
using Moq;
using System.Reflection;
using Microsoft.Teams.AI.Tests.TestUtils;
using Microsoft.Teams.AI.AI.OpenAI;
using Microsoft.Teams.AI.State;
using Record = Microsoft.Teams.AI.State.Record;

namespace Microsoft.Teams.AI.Tests.AITests
{
    public class OpenAIModeratorTests
    {
        [Fact]
        public async void Test_ReviewPrompt_ThrowsException()
        {
            // Arrange
            var apiKey = "randomApiKey";
            var turnContext = TurnStateConfig.CreateConfiguredTurnContext();
            var turnStateMock = TurnStateConfig.GetTurnStateWithConversationStateAsync(turnContext);
            var promptTemplate = new PromptTemplate(
                "prompt",
                new Prompt(new()
                {

                })
            )
            {
                Configuration = new PromptTemplateConfiguration
                {
                    Completion =
                    {
                        MaxTokens = 2000,
                        Temperature = 0.2,
                        TopP = 0.5,
                    }
                }
            };

            var clientMock = new Mock<OpenAIClient>(It.IsAny<OpenAIClientOptions>(), It.IsAny<ILogger>(), It.IsAny<HttpClient>());
            var exception = new TeamsAIException("Exception Message");
            clientMock.Setup(client => client.ExecuteTextModerationAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>())).ThrowsAsync(exception);

            var options = new OpenAIModeratorOptions(apiKey, ModerationType.Both);
            var moderator = new OpenAIModerator<TurnState<Record, Record, TempState>>(options);
            moderator.GetType().GetField("_client", BindingFlags.Instance | BindingFlags.NonPublic)!.SetValue(moderator, clientMock.Object);

            // Act
            var result = await Assert.ThrowsAsync<TeamsAIException>(async () => await moderator.ReviewInputAsync(turnContext, turnStateMock.Result));

            // Assert
            Assert.Equal("Exception Message", result.Message);
        }

        [Theory]
        [InlineData(ModerationType.Input)]
        [InlineData(ModerationType.Output)]
        [InlineData(ModerationType.Both)]
        public async void Test_ReviewPrompt_Flagged(ModerationType moderate)
        {
            // Arrange
            var apiKey = "randomApiKey";
            var turnContext = TurnStateConfig.CreateConfiguredTurnContext();
            var turnStateMock = TurnStateConfig.GetTurnStateWithConversationStateAsync(turnContext);
            var promptTemplate = new PromptTemplate(
                "prompt",
                new(new() { })
            )
            {
                Configuration = new PromptTemplateConfiguration
                {
                    Completion =
                    {
                        MaxTokens = 2000,
                        Temperature = 0.2,
                        TopP = 0.5,
                    }
                }
            };

            var clientMock = new Mock<OpenAIClient>(It.IsAny<OpenAIClientOptions>(), It.IsAny<ILogger>(), It.IsAny<HttpClient>());
            var response = new ModerationResponse()
            {
                Id = "Id",
                Model = "Model",
                Results = new List<ModerationResult>()
                {
                    new ModerationResult()
                    {
                        Flagged = true,
                        CategoriesFlagged = new ModerationCategoriesFlagged()
                        {
                            Hate = false,
                            HateThreatening = false,
                            SelfHarm = false,
                            Sexual = false,
                            SexualMinors = false,
                            Violence = true,
                            ViolenceGraphic = false,
                        },
                        CategoryScores = new ModerationCategoryScores()
                        {
                            Hate = 0,
                            HateThreatening = 0,
                            SelfHarm = 0,
                            Sexual = 0,
                            SexualMinors = 0,
                            Violence = 0.9,
                            ViolenceGraphic = 0,
                        }
                    }
                }
            };
            clientMock.Setup(client => client.ExecuteTextModerationAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>())).ReturnsAsync(response);

            var options = new OpenAIModeratorOptions(apiKey, moderate);
            var moderator = new OpenAIModerator<TurnState<Record, Record, TempState>>(options);
            moderator.GetType().GetField("_client", BindingFlags.Instance | BindingFlags.NonPublic)!.SetValue(moderator, clientMock.Object);

            // Act
            var result = await moderator.ReviewInputAsync(turnContext, turnStateMock.Result);

            // Assert
            if (moderate == ModerationType.Input || moderate == ModerationType.Both)
            {
                Assert.NotNull(result);
                Assert.Equal(AIConstants.DoCommand, result.Commands[0].Type);
                Assert.Equal(AIConstants.FlaggedInputActionName, ((PredictedDoCommand)result.Commands[0]).Action);
                Assert.NotNull(((PredictedDoCommand)result.Commands[0]).Parameters);
                Assert.True(((PredictedDoCommand)result.Commands[0]).Parameters!.ContainsKey("Result"));
                Assert.StrictEqual(response.Results[0], ((PredictedDoCommand)result.Commands[0]).Parameters!.GetValueOrDefault("Result"));
            }
            else
            {
                Assert.Null(result);
            }
        }

        [Fact]
        public async void Test_ReviewPlan_ThrowsException()
        {
            // Arrange
            var apiKey = "randomApiKey";

            var turnContext = TurnStateConfig.CreateConfiguredTurnContext();
            var turnStateMock = TurnStateConfig.GetTurnStateWithConversationStateAsync(turnContext);
            var plan = new Plan(new List<IPredictedCommand>()
            {
                new PredictedDoCommand("action"),
                new PredictedSayCommand("response"),
            });

            var clientMock = new Mock<OpenAIClient>(It.IsAny<OpenAIClientOptions>(), It.IsAny<ILogger>(), It.IsAny<HttpClient>());
            var exception = new TeamsAIException("Exception Message");
            clientMock.Setup(client => client.ExecuteTextModerationAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>())).ThrowsAsync(exception);

            var options = new OpenAIModeratorOptions(apiKey, ModerationType.Both);
            var moderator = new OpenAIModerator<TurnState<Record, Record, TempState>>(options);
            moderator.GetType().GetField("_client", BindingFlags.Instance | BindingFlags.NonPublic)!.SetValue(moderator, clientMock.Object);

            // Act
            var result = await Assert.ThrowsAsync<TeamsAIException>(async () => await moderator.ReviewOutputAsync(turnContext, turnStateMock.Result, plan));

            // Assert
            Assert.Equal("Exception Message", result.Message);
        }

        [Theory]
        [InlineData(ModerationType.Input)]
        [InlineData(ModerationType.Output)]
        [InlineData(ModerationType.Both)]
        public async void Test_ReviewPlan_Flagged(ModerationType moderate)
        {
            // Arrange
            var apiKey = "randomApiKey";

            var turnContext = TurnStateConfig.CreateConfiguredTurnContext();
            var turnStateMock = TurnStateConfig.GetTurnStateWithConversationStateAsync(turnContext);
            var plan = new Plan(new List<IPredictedCommand>()
            {
                new PredictedDoCommand("action"),
                new PredictedSayCommand("response"),
            });

            var clientMock = new Mock<OpenAIClient>(It.IsAny<OpenAIClientOptions>(), It.IsAny<ILogger>(), It.IsAny<HttpClient>());
            var response = new ModerationResponse()
            {
                Id = "Id",
                Model = "Model",
                Results = new List<ModerationResult>()
                {
                    new ModerationResult()
                    {
                        Flagged = true,
                        CategoriesFlagged = new ModerationCategoriesFlagged()
                        {
                            Hate = false,
                            HateThreatening = false,
                            SelfHarm = false,
                            Sexual = false,
                            SexualMinors = false,
                            Violence = true,
                            ViolenceGraphic = false,
                        },
                        CategoryScores = new ModerationCategoryScores()
                        {
                            Hate = 0,
                            HateThreatening = 0,
                            SelfHarm = 0,
                            Sexual = 0,
                            SexualMinors = 0,
                            Violence = 0.9,
                            ViolenceGraphic = 0,
                        }
                    }
                }
            };
            clientMock.Setup(client => client.ExecuteTextModerationAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>())).ReturnsAsync(response);

            var options = new OpenAIModeratorOptions(apiKey, moderate);
            var moderator = new OpenAIModerator<TurnState<Record, Record, TempState>>(options);
            moderator.GetType().GetField("_client", BindingFlags.Instance | BindingFlags.NonPublic)!.SetValue(moderator, clientMock.Object);

            // Act
            var result = await moderator.ReviewOutputAsync(turnContext, turnStateMock.Result, plan);

            // Assert
            if (moderate == ModerationType.Output || moderate == ModerationType.Both)
            {
                Assert.NotNull(result);
                Assert.Equal(AIConstants.DoCommand, result.Commands[0].Type);
                Assert.Equal(AIConstants.FlaggedOutputActionName, ((PredictedDoCommand)result.Commands[0]).Action);
                Assert.NotNull(((PredictedDoCommand)result.Commands[0]).Parameters);
                Assert.True(((PredictedDoCommand)result.Commands[0]).Parameters!.ContainsKey("Result"));
                Assert.StrictEqual(response.Results[0], ((PredictedDoCommand)result.Commands[0]).Parameters!.GetValueOrDefault("Result"));
            }
            else
            {
                Assert.StrictEqual(plan, result);
            }
        }
    }
}
