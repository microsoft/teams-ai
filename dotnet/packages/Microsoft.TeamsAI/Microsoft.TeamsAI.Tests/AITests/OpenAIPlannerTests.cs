using System.Reflection;

using Azure.AI.OpenAI;
using Microsoft.Bot.Builder;
using Microsoft.Extensions.Logging;
using Microsoft.SemanticKernel.AI.TextCompletion;
using Microsoft.SemanticKernel.AI.ChatCompletion;
using Microsoft.SemanticKernel.Connectors.AI.OpenAI.AzureSdk;
using Microsoft.SemanticKernel.Orchestration;
using Microsoft.Teams.AI.AI;
using Microsoft.Teams.AI.AI.Moderator;
using Microsoft.Teams.AI.AI.Planner;
using Microsoft.Teams.AI.AI.Prompt;
using Microsoft.Teams.AI.Exceptions;
using Microsoft.Teams.AI.Tests.TestUtils;
using Moq;
using System.Net;
using Microsoft.Teams.AI.State;
using Microsoft.Bot.Schema;

namespace Microsoft.Teams.AI.Tests.AITests
{
    public class OpenAIPlannerTests
    {
        [Fact]
        public async void Test_GeneratePlan_PromptCompletionHttpError_ShouldRedirectToHttpErrorAction()
        {
            // Arrange
            var apiKey = "randomApiKey";
            var model = "randomModelId";

            var options = new OpenAIPlannerOptions<TurnState>(apiKey, model, new PromptManager<TurnState>(), string.Empty);
            var turnContextMock = new Mock<ITurnContext>();
            var turnStateMock = new Mock<TurnState>();
            var moderatorMock = new Mock<IModerator<TurnState>>();

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

            static string httpErrorFunc() => throw new HttpOperationException("", (HttpStatusCode)429);
            var planner = new CustomCompletePromptOpenAIPlanner<TurnState>(options, httpErrorFunc);
            var aiOptions = new AIOptions<TurnState>(planner, moderatorMock.Object);

            // Act
            var result = await planner.GeneratePlanAsync(turnContextMock.Object, turnStateMock.Object, promptTemplate, aiOptions);

            // Assert
            Assert.Single(result.Commands);
            Assert.Equal(AIConstants.DoCommand, result.Commands[0].Type);

            var doCommand = (PredictedDoCommand)result.Commands[0];
            Assert.Equal(AIConstants.HttpErrorActionName, doCommand.Action);
            Assert.Empty(doCommand.Parameters!);

        }

        [Fact]
        public async void Test_GeneratePlan_PromptCompletionFailed_ThrowsException()
        {
            // Arrange
            var apiKey = "randomApiKey";
            var model = "randomModelId";

            var options = new OpenAIPlannerOptions<TurnState>(apiKey, model, new PromptManager<TurnState>(), string.Empty);
            var turnContextMock = new Mock<ITurnContext>();
            var turnStateMock = new Mock<TurnState>();
            var moderatorMock = new Mock<IModerator<TurnState>>();

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

            static string throwsExceptionFunc() => throw new TeamsAIException("Exception Message");
            var planner = new CustomCompletePromptOpenAIPlanner<TurnState>(options, throwsExceptionFunc);
            var aiOptions = new AIOptions<TurnState>(planner, moderatorMock.Object);

            // Act
            var exception = await Assert.ThrowsAsync<TeamsAIException>(async () => await planner.GeneratePlanAsync(turnContextMock.Object, turnStateMock.Object, promptTemplate, aiOptions));

            // Assert
            Assert.Equal("Exception Message", exception.Message);

        }

        [Fact]
        public async void Test_GeneratePlan_PromptCompletionEmptyStringResponse_ReturnsEmptyPlan()
        {
            // Arrange
            var apiKey = "randomApiKey";
            var model = "randomModelId";

            var options = new OpenAIPlannerOptions<TurnState>(apiKey, model, new PromptManager<TurnState>(), string.Empty);
            var turnContextMock = new Mock<ITurnContext>();
            var turnStateMock = new Mock<TurnState>();
            var moderatorMock = new Mock<IModerator<TurnState>>();

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

            static string emptyStringFunc() => string.Empty;
            var planner = new CustomCompletePromptOpenAIPlanner<TurnState>(options, emptyStringFunc);
            var aiOptions = new AIOptions<TurnState>(planner, moderatorMock.Object);

            // Act
            var result = await planner.GeneratePlanAsync(turnContextMock.Object, turnStateMock.Object, promptTemplate, aiOptions);

            // Assert
            Assert.NotNull(result);
            Assert.Empty(result.Commands);
        }

        [Fact]
        public async void Test_GeneratePlan_PromptCompletion_OneSayPerTurn()
        {
            // Arrange
            var apiKey = "randomApiKey";
            var model = "randomModelId";

            var options = new OpenAIPlannerOptions<TurnState>(apiKey, model, new PromptManager<TurnState>(), string.Empty);
            options.OneSayPerTurn = true;

            var turnContextMock = new Mock<ITurnContext>();
            var turnStateMock = new Mock<TurnState>();
            var moderatorMock = new Mock<IModerator<TurnState>>();

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

            string multipleSayCommands = "{ \"type\":\"plan\",\"commands\":[{\"type\":\"SAY\",\"response\":\"responseValueA\"}, {\"type\":\"SAY\",\"response\":\"responseValueB\"}]}";
            string multipleSayCommandsFunc() => multipleSayCommands;
            var planner = new CustomCompletePromptOpenAIPlanner<TurnState>(options, multipleSayCommandsFunc);
            var aiOptions = new AIOptions<TurnState>(planner, moderatorMock.Object);


            // Act
            var result = await planner.GeneratePlanAsync(turnContextMock.Object, turnStateMock.Object, promptTemplate, aiOptions);

            // Assert
            Assert.NotNull(result);
            Assert.Single(result.Commands);

            var sayCommand = (PredictedSayCommand)result.Commands[0];
            Assert.Equal("responseValueA", sayCommand.Response);
        }

        [Fact]
        public async void Test_GeneratePlan_Simple()
        {
            // Arrange
            var apiKey = "randomApiKey";
            var model = "randomModelId";

            var options = new OpenAIPlannerOptions<TurnState>(apiKey, model, new PromptManager<TurnState>(), string.Empty);

            var turnContextMock = new Mock<ITurnContext>();
            var turnStateMock = new Mock<TurnState>();
            var moderatorMock = new Mock<IModerator<TurnState>>();

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

            string simplePlan = "{ \"type\":\"plan\",\"commands\":[{\"type\":\"SAY\",\"response\":\"responseValueA\"}, {\"type\":\"DO\", \"action\": \"actionName\"}]}";
            string multipleSayCommandsFunc() => simplePlan;
            var planner = new CustomCompletePromptOpenAIPlanner<TurnState>(options, multipleSayCommandsFunc);

            var aiOptions = new AIOptions<TurnState>(planner, moderatorMock.Object);

            // Act
            var result = await planner.GeneratePlanAsync(turnContextMock.Object, turnStateMock.Object, promptTemplate, aiOptions);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(2, result.Commands.Count);

            var sayCommand = (PredictedSayCommand)result.Commands[0];
            Assert.Equal("responseValueA", sayCommand.Response);

            var doCommand = (PredictedDoCommand)result.Commands[1];
            Assert.Equal("actionName", doCommand.Action);
        }

        [Fact]
        public async void Test_CompletePrompt_TextCompletion_PromptCompletionRateLimited_ShouldThrowHttpOperationException()
        {
            // Arrange
            var apiKey = "randomApiKey";
            var model = "text-model";

            var options = new OpenAIPlannerOptions<TurnState>(apiKey, model, new PromptManager<TurnState>(), string.Empty);
            var turnContextMock = new Mock<ITurnContext>();
            var turnStateMock = new Mock<TurnState>();
            var moderatorMock = new Mock<IModerator<TurnState>>();

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

            var planner = new CustomCompletionOpenAIPlanner<TurnState>(options);
            var aiOptions = new AIOptions<TurnState>(planner, moderatorMock.Object);
            var exceptionMessage = "Exception Message";
            var thrownException = new SemanticKernel.Diagnostics.HttpOperationException(exceptionMessage)
            {
                StatusCode = (HttpStatusCode)429
            };

            planner.TextCompletionMock.Setup(textCompletion => textCompletion.GetCompletionsAsync(It.IsAny<string>(), It.IsAny<CompleteRequestSettings>(), It.IsAny<CancellationToken>())).ThrowsAsync(thrownException);

            // Act
            var exception = await Assert.ThrowsAsync<HttpOperationException>(async () => await planner.CompletePromptAsync(turnContextMock.Object, turnStateMock.Object, promptTemplate, aiOptions));

            // Assert
            Assert.NotNull(exception);
            Assert.True(exception.Message.Equals($"Error while executing AI prompt completion: {exceptionMessage}", StringComparison.OrdinalIgnoreCase));
            Assert.Equal((HttpStatusCode)429, exception.StatusCode);
        }

        [Fact]
        public async void Test_CompletePrompt_ChatCompletion_PromptCompletionRateLimited_ShouldThrowHttpOperationException()
        {
            // Arrange
            var apiKey = "randomApiKey";
            var model = "gpt-model";

            var options = new OpenAIPlannerOptions<TurnState>(apiKey, model, new PromptManager<TurnState>(), string.Empty);
            var botAdapterStub = Mock.Of<BotAdapter>();
            var turnContextMock = new TurnContext(botAdapterStub,
                new Activity
                {
                    Text = "user message",
                    Recipient = new() { Id = "recipientId" },
                    Conversation = new() { Id = "conversationId" },
                    From = new() { Id = "fromId" },
                    ChannelId = "channelId"
                });
            var turnState = TurnStateConfig.GetTurnStateWithConversationStateAsync(turnContextMock);
            var moderatorMock = new Mock<IModerator<TurnState>>();

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

            var planner = new CustomCompletionOpenAIPlannerWithTurnState(options);
            var aiOptions = new AIOptions<TurnState>(planner, moderatorMock.Object);
            var exceptionMessage = "Exception Message";
            var thrownException = new SemanticKernel.Diagnostics.HttpOperationException(exceptionMessage)
            {
                StatusCode = (HttpStatusCode)429
            };

            planner.ChatCompletionMock
            .Setup(m => m.CreateNewChat(It.IsAny<string?>()))
            .Returns(new ChatHistory());

            planner.ChatCompletionMock.Setup(chatCompletion => chatCompletion.GetChatCompletionsAsync(It.IsAny<ChatHistory>(), It.IsAny<ChatRequestSettings>(), It.IsAny<CancellationToken>())).ThrowsAsync(thrownException);

            // Act
            var exception = await Assert.ThrowsAsync<HttpOperationException>(async () => await planner.CompletePromptAsync(turnContextMock, turnState.Result, promptTemplate, aiOptions));

            // Assert
            Assert.NotNull(exception);
            Assert.True(exception.Message.Equals($"Error while executing AI prompt completion: {exceptionMessage}", StringComparison.OrdinalIgnoreCase));
            Assert.Equal((HttpStatusCode)429, exception.StatusCode);
        }

        [Fact]
        public async void Test_CompletePromptAsync_TextCompletion()
        {
            // Arrange
            var apiKey = "randomApiKey";
            var model = "randomModelId";

            var options = new OpenAIPlannerOptions<TurnState>(apiKey, model, new PromptManager<TurnState>(), string.Empty);
            var turnContextMock = new Mock<ITurnContext>();
            var turnStateMock = new Mock<TurnState>();
            var promptTemplate = new PromptTemplate("Test", new());

            var planner = new CustomCompletionOpenAIPlanner<TurnState>(options);
            var aiOptions = new AIOptions<TurnState>(planner);
            MockTextCompletion(planner.TextCompletionMock, "text-completion");

            // Act
            var result = await planner.CompletePromptAsync(turnContextMock.Object, turnStateMock.Object, promptTemplate, aiOptions);

            // Assert
            Assert.Equal("text-completion", result);
        }

        [Fact]
        public async void Test_CompletePromptAsync_ChatCompletion()
        {
            // Arrange
            var apiKey = "randomApiKey";
            var model = "gpt-randomModelId";

            var options = new OpenAIPlannerOptions<TurnState>(apiKey, model, new PromptManager<TurnState>(), string.Empty);
            var botAdapterStub = Mock.Of<BotAdapter>();
            var turnContextMock = new TurnContext(botAdapterStub,
                new Activity
                {
                    Text = "user message",
                    Recipient = new() { Id = "recipientId" },
                    Conversation = new() { Id = "conversationId" },
                    From = new() { Id = "fromId" },
                    ChannelId = "channelId"
                });
            var turnState = TurnStateConfig.GetTurnStateWithConversationStateAsync(turnContextMock);
            var promptTemplate = new PromptTemplate("Test", new());

            var planner = new CustomCompletionOpenAIPlannerWithTurnState(options);
            var aiOptions = new AIOptions<TurnState>(planner);
            MockChatCompletion(planner.ChatCompletionMock, "chat-completion");

            // Act
            var result = await planner.CompletePromptAsync(turnContextMock, turnState.Result, promptTemplate, aiOptions);

            // Assert
            Assert.Equal("chat-completion", result);
        }

        private sealed class CustomCompletePromptOpenAIPlanner<TState> : OpenAIPlanner<TState>
            where TState : TurnState
        {
            private Func<string> customFunction;

            public CustomCompletePromptOpenAIPlanner(OpenAIPlannerOptions<TState> options, Func<string> customFunction, ILoggerFactory? loggerFactory = null) : base(options, loggerFactory)
            {
                this.customFunction = customFunction;
            }

            public override Task<string> CompletePromptAsync(ITurnContext turnContext, TState turnState, PromptTemplate promptTemplate, AIOptions<TState> options, CancellationToken cancellationToken = default)
            {
                return Task.FromResult(customFunction.Invoke());
            }

        }

        private sealed class CustomCompletionOpenAIPlanner<TState> : OpenAIPlanner<TState>
            where TState : TurnState
        {
            public Mock<ITextCompletion> TextCompletionMock { get; } = new Mock<ITextCompletion>();

            public Mock<IChatCompletion> ChatCompletionMock { get; } = new Mock<IChatCompletion>();

            public CustomCompletionOpenAIPlanner(OpenAIPlannerOptions<TState> options, ILoggerFactory? loggerFactory = null) : base(options, loggerFactory)
            {
            }

            private protected override ITextCompletion _CreateTextCompletionService(OpenAIPlannerOptions<TState> options)
            {
                return TextCompletionMock.Object;
            }

            private protected override IChatCompletion _CreateChatCompletionService(OpenAIPlannerOptions<TState> options)
            {
                return ChatCompletionMock.Object;
            }
        }

        private sealed class CustomCompletionOpenAIPlannerWithTurnState : OpenAIPlanner<TurnState>
        {
            public Mock<ITextCompletion> TextCompletionMock { get; } = new Mock<ITextCompletion>();

            public Mock<IChatCompletion> ChatCompletionMock { get; } = new Mock<IChatCompletion>();

            public CustomCompletionOpenAIPlannerWithTurnState(OpenAIPlannerOptions<TurnState> options, ILoggerFactory? loggerFactory = null) : base(options, loggerFactory)
            {
            }

            private protected override ITextCompletion _CreateTextCompletionService(OpenAIPlannerOptions<TurnState> options)
            {
                return TextCompletionMock.Object;
            }

            private protected override IChatCompletion _CreateChatCompletionService(OpenAIPlannerOptions<TurnState> options)
            {
                return ChatCompletionMock.Object;
            }
        }

        /// <summary>
        /// Setup mock of ITextCompletion 
        /// </summary>
        private static void MockTextCompletion(Mock<ITextCompletion> mock, string completionResult)
        {
            // Create TextModelResult
            // Early version does not expose public constructor.
            var completionsUsage = (CompletionsUsage)typeof(CompletionsUsage)
                .GetConstructor(BindingFlags.NonPublic | BindingFlags.Instance, new[] { typeof(int), typeof(int), typeof(int) })!
                .Invoke(new object[] { 1, 1, 1 })!;
            var completionsLogProbabilityModel = (CompletionsLogProbabilityModel)typeof(CompletionsLogProbabilityModel)
                .GetConstructor(BindingFlags.NonPublic | BindingFlags.Instance, new[] { typeof(IEnumerable<string>), typeof(IEnumerable<float?>), typeof(IEnumerable<IDictionary<string, float?>>), typeof(IEnumerable<int>) })!
                .Invoke(new object[] { Array.Empty<string>(), Array.Empty<float?>(), Array.Empty<IDictionary<string, float?>>(), Array.Empty<int>() });
            var choice = (Choice)typeof(Choice)
                .GetConstructor(BindingFlags.NonPublic | BindingFlags.Instance, new[] { typeof(string), typeof(int), typeof(CompletionsLogProbabilityModel), typeof(CompletionsFinishReason) })!
                .Invoke(new object[] { "", 1, completionsLogProbabilityModel, CompletionsFinishReason.Stopped });
            var completions = (Completions)typeof(Completions)
                .GetConstructor(BindingFlags.NonPublic | BindingFlags.Instance, new[] { typeof(string), typeof(DateTimeOffset), typeof(IEnumerable<Choice>), typeof(CompletionsUsage) })!
                .Invoke(new object[] { "", DateTimeOffset.Now, new List<Choice> { choice }, completionsUsage });
            var textModelResult = (TextModelResult)typeof(TextModelResult)
                .GetConstructor(BindingFlags.NonPublic | BindingFlags.Instance, new[] { typeof(Completions), typeof(Choice) })!
                .Invoke(new object[] { completions, choice });

            var textResultMock = new Mock<ITextResult>();
            textResultMock.Setup(tr => tr.ModelResult).Returns(new ModelResult(textModelResult));
            textResultMock.Setup(tr => tr.GetCompletionAsync(It.IsAny<CancellationToken>())).ReturnsAsync(completionResult);
            mock
                .Setup(m => m.GetCompletionsAsync(It.IsAny<string>(), It.IsAny<CompleteRequestSettings>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(new List<ITextResult> { textResultMock.Object });
        }

        /// <summary>
        /// Setup mock of IChatCompletion 
        /// </summary>
        private static void MockChatCompletion(Mock<IChatCompletion> mock, string completionResult)
        {
            // Create ChatModelResult
            // Early version does not expose public constructor.
            var completionsUsage = (CompletionsUsage)typeof(CompletionsUsage)
                .GetConstructor(BindingFlags.NonPublic | BindingFlags.Instance, new[] { typeof(int), typeof(int), typeof(int) })!
                .Invoke(new object[] { 1, 1, 1 })!;
            var chatChoice = (ChatChoice)typeof(ChatChoice)
                .GetConstructor(BindingFlags.NonPublic | BindingFlags.Instance, new[] { typeof(int), typeof(CompletionsFinishReason) })!
                .Invoke(new object[] { 1, CompletionsFinishReason.Stopped });
            var completions = (ChatCompletions)typeof(ChatCompletions)
                .GetConstructor(BindingFlags.NonPublic | BindingFlags.Instance, new[] { typeof(string), typeof(DateTimeOffset), typeof(IReadOnlyList<ChatChoice>), typeof(CompletionsUsage) })!
                .Invoke(new object[] { "", DateTimeOffset.Now, new ChatChoice[] { chatChoice }, completionsUsage });
            var chatModelResult = (ChatModelResult)typeof(ChatModelResult)
                .GetConstructor(BindingFlags.NonPublic | BindingFlags.Instance, new[] { typeof(ChatCompletions), typeof(ChatChoice) })!
                .Invoke(new object[] { completions, chatChoice });

            var chatHistory = new ChatHistory();
            chatHistory.AddMessage(AuthorRole.User, completionResult);

            var chatResultMock = new Mock<IChatResult>();
            chatResultMock
                .Setup(cr => cr.GetChatMessageAsync(It.IsAny<CancellationToken>()))
                .ReturnsAsync(chatHistory[0]);
            chatResultMock.As<IChatResult>().Setup(tr => tr.ModelResult).Returns(new ModelResult(chatModelResult));
            mock
                .Setup(m => m.CreateNewChat(It.IsAny<string?>()))
                .Returns(chatHistory);
            mock
                .Setup(m => m.GetChatCompletionsAsync(It.IsAny<ChatHistory>(), It.IsAny<ChatRequestSettings>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(new List<IChatResult> { chatResultMock.Object });
        }
    }
}
