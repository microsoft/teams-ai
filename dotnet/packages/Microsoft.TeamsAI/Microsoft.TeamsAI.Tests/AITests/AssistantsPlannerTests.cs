using Microsoft.Bot.Builder;
using Microsoft.Bot.Schema;
using Microsoft.Teams.AI.AI;
using Microsoft.Teams.AI.AI.Planners.Experimental;
using Microsoft.Teams.AI.Exceptions;
using Record = Microsoft.Teams.AI.State.Record;
using Microsoft.Teams.AI.Tests.TestUtils;
using Moq;
using System.Reflection;
using Microsoft.Teams.AI.AI.Planners;
using Azure.AI.OpenAI.Assistants;

namespace Microsoft.Teams.AI.Tests.AITests
{
    public class AssistantsPlannerTests
    {
        [Fact]
        public async Task Test_BeginTaskAsync_Assistant_Single_Reply()
        {
            // Arrange
            var testClient = new TestAssistantsOpenAIClient();
            var planner = new AssistantsPlanner<AssistantsState>(new("test-key", "test-assistant-id")
            {
                PollingInterval = TimeSpan.FromMilliseconds(100)
            });
            planner.GetType().GetField("_client", BindingFlags.Instance | BindingFlags.NonPublic)!.SetValue(planner, testClient);
            var turnContextMock = new Mock<ITurnContext>();
            var turnState = await _CreateAssistantsState();
            turnState.Temp!.Input = "hello";

            var aiOptions = new AIOptions<AssistantsState>(planner);
            var ai = new AI<AssistantsState>(aiOptions);

            testClient.RemainingRunStatus.Enqueue("completed");
            testClient.RemainingMessages.Enqueue("welcome");

            // Act
            var plan = await planner.BeginTaskAsync(turnContextMock.Object, turnState, ai, CancellationToken.None);

            // Assert
            Assert.NotNull(plan);
            Assert.NotNull(plan.Commands);
            Assert.Single(plan.Commands);
            Assert.Equal(AIConstants.SayCommand, plan.Commands[0].Type);
            Assert.Equal("welcome", ((PredictedSayCommand)plan.Commands[0]).Response.Content);
        }

        [Fact]
        public async Task Test_BeginTaskAsync_Assistant_WaitForCurrentRun()
        {
            // Arrange
            var testClient = new TestAssistantsOpenAIClient();
            var planner = new AssistantsPlanner<AssistantsState>(new("test-key", "test-assistant-id")
            {
                PollingInterval = TimeSpan.FromMilliseconds(100)
            });
            planner.GetType().GetField("_client", BindingFlags.Instance | BindingFlags.NonPublic)!.SetValue(planner, testClient);
            var turnContextMock = new Mock<ITurnContext>();
            var turnState = await _CreateAssistantsState();
            turnState.Temp!.Input = "hello";

            var aiOptions = new AIOptions<AssistantsState>(planner);
            var ai = new AI<AssistantsState>(aiOptions);

            testClient.RemainingRunStatus.Enqueue("in_progress");
            testClient.RemainingRunStatus.Enqueue("completed");
            testClient.RemainingMessages.Enqueue("welcome");

            // Act
            var plan = await planner.BeginTaskAsync(turnContextMock.Object, turnState, ai, CancellationToken.None);

            // Assert
            Assert.NotNull(plan);
            Assert.NotNull(plan.Commands);
            Assert.Single(plan.Commands);
            Assert.Equal(AIConstants.SayCommand, plan.Commands[0].Type);
            Assert.Equal("welcome", ((PredictedSayCommand)plan.Commands[0]).Response.Content);
        }

        [Fact]
        public async Task Test_BeginTaskAsync_Assistant_WaitForPreviousRun()
        {
            // Arrange
            var testClient = new TestAssistantsOpenAIClient();
            var planner = new AssistantsPlanner<AssistantsState>(new("test-key", "test-assistant-id")
            {
                PollingInterval = TimeSpan.FromMilliseconds(100)
            });
            planner.GetType().GetField("_client", BindingFlags.Instance | BindingFlags.NonPublic)!.SetValue(planner, testClient);
            var turnContextMock = new Mock<ITurnContext>();
            var turnState = await _CreateAssistantsState();
            turnState.Temp!.Input = "hello";

            var aiOptions = new AIOptions<AssistantsState>(planner);
            var ai = new AI<AssistantsState>(aiOptions);

            testClient.RemainingRunStatus.Enqueue("failed");
            testClient.RemainingRunStatus.Enqueue("completed");
            testClient.RemainingMessages.Enqueue("welcome");

            AssistantThread thread = await testClient.CreateThreadAsync(new(), CancellationToken.None);
            await testClient.CreateRunAsync(thread.Id, AssistantsModelFactory.CreateRunOptions(), CancellationToken.None);
            turnState.ThreadId = thread.Id;

            // Act
            var plan = await planner.BeginTaskAsync(turnContextMock.Object, turnState, ai, CancellationToken.None);

            // Assert
            Assert.NotNull(plan);
            Assert.NotNull(plan.Commands);
            Assert.Single(plan.Commands);
            Assert.Equal(AIConstants.SayCommand, plan.Commands[0].Type);
            Assert.Equal("welcome", ((PredictedSayCommand)plan.Commands[0]).Response.Content);
        }

        [Fact]
        public async Task Test_BeginTaskAsync_Assistant_RunCancelled()
        {
            // Arrange
            var testClient = new TestAssistantsOpenAIClient();
            var planner = new AssistantsPlanner<AssistantsState>(new("test-key", "test-assistant-id")
            {
                PollingInterval = TimeSpan.FromMilliseconds(100)
            });
            planner.GetType().GetField("_client", BindingFlags.Instance | BindingFlags.NonPublic)!.SetValue(planner, testClient);
            var turnContextMock = new Mock<ITurnContext>();
            var turnState = await _CreateAssistantsState();
            turnState.Temp!.Input = "hello";

            var aiOptions = new AIOptions<AssistantsState>(planner);
            var ai = new AI<AssistantsState>(aiOptions);

            testClient.RemainingRunStatus.Enqueue("cancelled");
            testClient.RemainingMessages.Enqueue("welcome");

            // Act
            var plan = await planner.BeginTaskAsync(turnContextMock.Object, turnState, ai, CancellationToken.None);

            // Assert
            Assert.NotNull(plan);
            Assert.NotNull(plan.Commands);
            Assert.Empty(plan.Commands);
        }

        [Fact]
        public async Task Test_BeginTaskAsync_Assistant_RunExpired()
        {
            // Arrange
            var testClient = new TestAssistantsOpenAIClient();
            var planner = new AssistantsPlanner<AssistantsState>(new("test-key", "test-assistant-id")
            {
                PollingInterval = TimeSpan.FromMilliseconds(100)
            });
            planner.GetType().GetField("_client", BindingFlags.Instance | BindingFlags.NonPublic)!.SetValue(planner, testClient);
            var turnContextMock = new Mock<ITurnContext>();
            var turnState = await _CreateAssistantsState();
            turnState.Temp!.Input = "hello";

            var aiOptions = new AIOptions<AssistantsState>(planner);
            var ai = new AI<AssistantsState>(aiOptions);

            testClient.RemainingRunStatus.Enqueue("expired");
            testClient.RemainingMessages.Enqueue("welcome");

            // Act
            var plan = await planner.BeginTaskAsync(turnContextMock.Object, turnState, ai, CancellationToken.None);

            // Assert
            Assert.NotNull(plan);
            Assert.NotNull(plan.Commands);
            Assert.Single(plan.Commands);
            Assert.Equal(AIConstants.DoCommand, plan.Commands[0].Type);
            Assert.Equal(AIConstants.TooManyStepsActionName, ((PredictedDoCommand)plan.Commands[0]).Action);
        }

        [Fact]
        public async Task Test_BeginTaskAsync_Assistant_RunFailed()
        {
            // Arrange
            var testClient = new TestAssistantsOpenAIClient();
            var planner = new AssistantsPlanner<AssistantsState>(new("test-key", "test-assistant-id")
            {
                PollingInterval = TimeSpan.FromMilliseconds(100)
            });
            planner.GetType().GetField("_client", BindingFlags.Instance | BindingFlags.NonPublic)!.SetValue(planner, testClient);
            var turnContextMock = new Mock<ITurnContext>();
            var turnState = await _CreateAssistantsState();
            turnState.Temp!.Input = "hello";

            var aiOptions = new AIOptions<AssistantsState>(planner);
            var ai = new AI<AssistantsState>(aiOptions);

            testClient.RemainingRunStatus.Enqueue("failed");
            testClient.RemainingMessages.Enqueue("welcome");

            // Act
            var exception = await Assert.ThrowsAsync<TeamsAIException>(() => planner.BeginTaskAsync(turnContextMock.Object, turnState, ai, CancellationToken.None));

            // Assert
            Assert.NotNull(exception);
            Assert.NotNull(exception.Message);
            Assert.True(exception.Message.IndexOf("Run failed") >= 0);
        }

        [Fact]
        public async Task Test_ContinueTaskAsync_Assistant_RequiresAction()
        {
            // Arrange
            var testClient = new TestAssistantsOpenAIClient();
            var planner = new AssistantsPlanner<AssistantsState>(new("test-key", "test-assistant-id")
            {
                PollingInterval = TimeSpan.FromMilliseconds(100)
            });
            planner.GetType().GetField("_client", BindingFlags.Instance | BindingFlags.NonPublic)!.SetValue(planner, testClient);
            var turnContextMock = new Mock<ITurnContext>();
            var turnState = await _CreateAssistantsState();
            turnState.Temp!.Input = "hello";

            var aiOptions = new AIOptions<AssistantsState>(planner);
            var ai = new AI<AssistantsState>(aiOptions);

            var functionToolCall = AssistantsModelFactory.RequiredFunctionToolCall("test-tool-id", "test-action", "{}");
            var requiredAction = AssistantsModelFactory.SubmitToolOutputsAction(new List<RequiredToolCall>{ functionToolCall });

            testClient.RemainingActions.Enqueue(requiredAction);
            testClient.RemainingRunStatus.Enqueue("requires_action");
            testClient.RemainingRunStatus.Enqueue("in_progress");
            testClient.RemainingRunStatus.Enqueue("completed");
            testClient.RemainingMessages.Enqueue("welcome");

            // Act
            var plan1 = await planner.ContinueTaskAsync(turnContextMock.Object, turnState, ai, CancellationToken.None);
            turnState.Temp.ActionOutputs["test-action"] = "test-output";
            var plan2 = await planner.ContinueTaskAsync(turnContextMock.Object, turnState, ai, CancellationToken.None);

            // Assert
            Assert.NotNull(plan1);
            Assert.NotNull(plan1.Commands);
            Assert.Single(plan1.Commands);
            Assert.Equal(AIConstants.DoCommand, plan1.Commands[0].Type);
            Assert.Equal("test-action", ((PredictedDoCommand)plan1.Commands[0]).Action);
            Assert.NotNull(plan2);
            Assert.NotNull(plan2.Commands);
            Assert.Single(plan2.Commands);
            Assert.Equal(AIConstants.SayCommand, plan2.Commands[0].Type);
            Assert.Equal("welcome", ((PredictedSayCommand)plan2.Commands[0]).Response.Content);
            Assert.Single(turnState.SubmitToolMap);
            Assert.Equal("test-action", turnState.SubmitToolMap.First().Key);
            Assert.Equal("test-tool-id", turnState.SubmitToolMap.First().Value);
        }

        [Fact]
        public async Task Test_ContinueTaskAsync_Assistant_IgnoreRedundantAction()
        {
            // Arrange
            var testClient = new TestAssistantsOpenAIClient();
            var planner = new AssistantsPlanner<AssistantsState>(new("test-key", "test-assistant-id")
            {
                PollingInterval = TimeSpan.FromMilliseconds(100)
            });
            planner.GetType().GetField("_client", BindingFlags.Instance | BindingFlags.NonPublic)!.SetValue(planner, testClient);
            var turnContextMock = new Mock<ITurnContext>();
            var turnState = await _CreateAssistantsState();
            turnState.Temp!.Input = "hello";
            turnState.Temp.ActionOutputs["other-action"] = "should not be used";

            var aiOptions = new AIOptions<AssistantsState>(planner);
            var ai = new AI<AssistantsState>(aiOptions);

            var functionToolCall = AssistantsModelFactory.RequiredFunctionToolCall("test-tool-id", "test-action", "{}");
            var requiredAction = AssistantsModelFactory.SubmitToolOutputsAction(new List<RequiredToolCall> { functionToolCall });

            testClient.RemainingActions.Enqueue(requiredAction);
            testClient.RemainingRunStatus.Enqueue("requires_action");
            testClient.RemainingRunStatus.Enqueue("in_progress");
            testClient.RemainingRunStatus.Enqueue("completed");
            testClient.RemainingMessages.Enqueue("welcome");

            // Act
            var plan1 = await planner.ContinueTaskAsync(turnContextMock.Object, turnState, ai, CancellationToken.None);
            turnState.Temp.ActionOutputs["test-action"] = "test-output";
            var plan2 = await planner.ContinueTaskAsync(turnContextMock.Object, turnState, ai, CancellationToken.None);

            // Assert
            Assert.NotNull(plan1);
            Assert.NotNull(plan1.Commands);
            Assert.Single(plan1.Commands);
            Assert.Equal(AIConstants.DoCommand, plan1.Commands[0].Type);
            Assert.Equal("test-action", ((PredictedDoCommand)plan1.Commands[0]).Action);
            Assert.NotNull(plan2);
            Assert.NotNull(plan2.Commands);
            Assert.Single(plan2.Commands);
            Assert.Equal(AIConstants.SayCommand, plan2.Commands[0].Type);
            Assert.Equal("welcome", ((PredictedSayCommand)plan2.Commands[0]).Response.Content);
            Assert.Single(turnState.SubmitToolMap);
            Assert.Equal("test-action", turnState.SubmitToolMap.First().Key);
            Assert.Equal("test-tool-id", turnState.SubmitToolMap.First().Value);
        }


        [Fact]
        public async Task Test_ContinueTaskAsync_Assistant_MultipleMessages()
        {
            // Arrange
            var testClient = new TestAssistantsOpenAIClient();
            var planner = new AssistantsPlanner<AssistantsState>(new("test-key", "test-assistant-id")
            {
                PollingInterval = TimeSpan.FromMilliseconds(100)
            });
            planner.GetType().GetField("_client", BindingFlags.Instance | BindingFlags.NonPublic)!.SetValue(planner, testClient);
            var turnContextMock = new Mock<ITurnContext>();
            var turnState = await _CreateAssistantsState();
            turnState.Temp!.Input = "hello";

            var aiOptions = new AIOptions<AssistantsState>(planner);
            var ai = new AI<AssistantsState>(aiOptions);

            testClient.RemainingRunStatus.Enqueue("completed");
            testClient.RemainingMessages.Enqueue("message 2");
            testClient.RemainingMessages.Enqueue("message 1");
            testClient.RemainingMessages.Enqueue("welcome");

            // Act
            var plan = await planner.ContinueTaskAsync(turnContextMock.Object, turnState, ai, CancellationToken.None);

            // Assert
            Assert.NotNull(plan);
            Assert.NotNull(plan.Commands);
            Assert.Equal(3, plan.Commands.Count);
            Assert.Equal(AIConstants.SayCommand, plan.Commands[0].Type);
            Assert.Equal("welcome", ((PredictedSayCommand)plan.Commands[0]).Response.Content);
            Assert.Equal("message 1", ((PredictedSayCommand)plan.Commands[1]).Response.Content);
            Assert.Equal("message 2", ((PredictedSayCommand)plan.Commands[2]).Response.Content);
        }

        private static async Task<AssistantsState> _CreateAssistantsState()
        {
            var state = new AssistantsState();
            var conversationState = new Record();
            var userState = new Record();

            ITurnContext turnContext = new TurnContext(new NotImplementedAdapter(), new Activity(
                text: "hello",
                channelId: "channelId",
                recipient: new() { Id = "recipientId" },
                conversation: new() { Id = "conversationId" },
                from: new() { Id = "fromId" }
            ));
            string channelId = turnContext.Activity.ChannelId;
            string botId = turnContext.Activity.Recipient.Id;
            string conversationId = turnContext.Activity.Conversation.Id;
            string userId = turnContext.Activity.From.Id;
            string conversationKey = $"{channelId}/${botId}/conversations/${conversationId}";
            string userKey = $"{channelId}/${botId}/users/${userId}";

            Mock<IStorage> storage = new();
            storage.Setup(storage => storage.ReadAsync(new string[] { conversationKey, userKey }, It.IsAny<CancellationToken>())).Returns(() =>
            {
                IDictionary<string, object> items = new Dictionary<string, object>();
                items[conversationKey] = conversationState;
                items[userKey] = userState;
                return Task.FromResult(items);
            });

            await state.LoadStateAsync(storage.Object, turnContext);
            return state;
        }
    }
}
