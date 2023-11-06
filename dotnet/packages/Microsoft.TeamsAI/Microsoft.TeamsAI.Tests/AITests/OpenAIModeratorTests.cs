using Castle.Core.Logging;
using Microsoft.Teams.AI.AI;
using Microsoft.Teams.AI.AI.Moderator;
using Microsoft.Teams.AI.AI.Planner;
using Microsoft.Teams.AI.AI.Prompt;
using Microsoft.Teams.AI.Exceptions;
using Microsoft.Bot.Schema;
using Moq;
using System.Reflection;
using Microsoft.Teams.AI.Tests.TestUtils;
using Microsoft.Bot.Builder;
using Microsoft.Teams.AI.AI.OpenAI;

namespace Microsoft.Teams.AI.Tests.AITests
{
    public class OpenAIModeratorTests
    {
        [Fact]
        public async void Test_ReviewPrompt_ThrowsException()
        {
            // Arrange
            var apiKey = "randomApiKey";

            var botAdapterMock = new Mock<BotAdapter>();
            var activity = new Activity()
            {
                Text = "input",
            };
            var turnContext = new TurnContext(botAdapterMock.Object, activity);
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

            var clientMock = new Mock<OpenAIClient>(It.IsAny<OpenAIClientOptions>(), It.IsAny<ILogger>(), It.IsAny<HttpClient>());
            var exception = new TeamsAIException("Exception Message");
            clientMock.Setup(client => client.ExecuteTextModeration(It.IsAny<string>(), It.IsAny<string>())).ThrowsAsync(exception);

            var options = new OpenAIModeratorOptions(apiKey, ModerationType.Both);
            var moderator = new OpenAIModerator<TestTurnState>(options);
            moderator.GetType().GetField("_client", BindingFlags.Instance | BindingFlags.NonPublic)!.SetValue(moderator, clientMock.Object);

            // Act
            var result = await Assert.ThrowsAsync<TeamsAIException>(async () => await moderator.ReviewPrompt(turnContext, turnStateMock.Object, promptTemplate));

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

            var botAdapterMock = new Mock<BotAdapter>();
            // TODO: when TestTurnState is implemented, get the user input
            var activity = new Activity()
            {
                Text = "input",
            };
            var turnContext = new TurnContext(botAdapterMock.Object, activity);
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
            clientMock.Setup(client => client.ExecuteTextModeration(It.IsAny<string>(), It.IsAny<string>())).ReturnsAsync(response);

            var options = new OpenAIModeratorOptions(apiKey, moderate);
            var moderator = new OpenAIModerator<TestTurnState>(options);
            moderator.GetType().GetField("_client", BindingFlags.Instance | BindingFlags.NonPublic)!.SetValue(moderator, clientMock.Object);

            // Act
            var result = await moderator.ReviewPrompt(turnContext, turnStateMock.Object, promptTemplate);

            // Assert
            if (moderate == ModerationType.Input || moderate == ModerationType.Both)
            {
                Assert.NotNull(result);
                Assert.Equal(AIConstants.DoCommand, result.Commands[0].Type);
                Assert.Equal(AIConstants.FlaggedInputActionName, ((PredictedDoCommand)result.Commands[0]).Action);
                Assert.NotNull(((PredictedDoCommand)result.Commands[0]).Entities);
                Assert.True(((PredictedDoCommand)result.Commands[0]).Entities!.ContainsKey("Result"));
                Assert.StrictEqual(response.Results[0], ((PredictedDoCommand)result.Commands[0]).Entities!.GetValueOrDefault("Result"));
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

            var turnContextMock = new Mock<ITurnContext>();
            var turnStateMock = new Mock<TestTurnState>();
            var plan = new Plan(new List<IPredictedCommand>()
            {
                new PredictedDoCommand("action"),
                new PredictedSayCommand("response"),
            });

            var clientMock = new Mock<OpenAIClient>(It.IsAny<OpenAIClientOptions>(), It.IsAny<ILogger>(), It.IsAny<HttpClient>());
            var exception = new TeamsAIException("Exception Message");
            clientMock.Setup(client => client.ExecuteTextModeration(It.IsAny<string>(), It.IsAny<string>())).ThrowsAsync(exception);

            var options = new OpenAIModeratorOptions(apiKey, ModerationType.Both);
            var moderator = new OpenAIModerator<TestTurnState>(options);
            moderator.GetType().GetField("_client", BindingFlags.Instance | BindingFlags.NonPublic)!.SetValue(moderator, clientMock.Object);

            // Act
            var result = await Assert.ThrowsAsync<TeamsAIException>(async () => await moderator.ReviewPlan(turnContextMock.Object, turnStateMock.Object, plan));

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

            var turnContextMock = new Mock<ITurnContext>();
            var turnStateMock = new Mock<TestTurnState>();
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
            clientMock.Setup(client => client.ExecuteTextModeration(It.IsAny<string>(), It.IsAny<string>())).ReturnsAsync(response);

            var options = new OpenAIModeratorOptions(apiKey, moderate);
            var moderator = new OpenAIModerator<TestTurnState>(options);
            moderator.GetType().GetField("_client", BindingFlags.Instance | BindingFlags.NonPublic)!.SetValue(moderator, clientMock.Object);

            // Act
            var result = await moderator.ReviewPlan(turnContextMock.Object, turnStateMock.Object, plan);

            // Assert
            if (moderate == ModerationType.Output || moderate == ModerationType.Both)
            {
                Assert.NotNull(result);
                Assert.Equal(AIConstants.DoCommand, result.Commands[0].Type);
                Assert.Equal(AIConstants.FlaggedOutputActionName, ((PredictedDoCommand)result.Commands[0]).Action);
                Assert.NotNull(((PredictedDoCommand)result.Commands[0]).Entities);
                Assert.True(((PredictedDoCommand)result.Commands[0]).Entities!.ContainsKey("Result"));
                Assert.StrictEqual(response.Results[0], ((PredictedDoCommand)result.Commands[0]).Entities!.GetValueOrDefault("Result"));
            }
            else
            {
                Assert.StrictEqual(plan, result);
            }
        }
    }
}
