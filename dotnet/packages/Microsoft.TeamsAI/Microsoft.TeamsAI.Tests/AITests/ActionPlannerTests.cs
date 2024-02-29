using Microsoft.Bot.Builder;
using Microsoft.Teams.AI.AI;
using Microsoft.Teams.AI.AI.Augmentations;
using Microsoft.Teams.AI.AI.Models;
using Microsoft.Teams.AI.AI.Planners;
using Microsoft.Teams.AI.AI.Prompts;
using Microsoft.Teams.AI.AI.Tokenizers;
using Microsoft.Teams.AI.AI.Validators;
using Microsoft.Teams.AI.State;
using Microsoft.Teams.AI.Tests.TestUtils;
using Moq;

namespace Microsoft.Teams.AI.Tests.AITests
{
    public class ActionPlannerTests
    {
        [Fact]
        public async void Test_CompletePromptAsync_HasPrompt()
        {
            // Arrange
            var modelMock = new Mock<IPromptCompletionModel>();
            var responseMock = new Mock<PromptResponse>();
            modelMock.Setup(model => model.CompletePromptAsync(
                It.IsAny<ITurnContext>(),
                It.IsAny<IMemory>(),
                It.IsAny<IPromptFunctions<List<string>>>(),
                It.IsAny<ITokenizer>(),
                It.IsAny<PromptTemplate>(),
                It.IsAny<CancellationToken>())).ReturnsAsync(responseMock.Object);
            var promptTemplate = new PromptTemplate(
                "prompt",
                new(new() { })
            );
            var prompts = new PromptManager();
            prompts.AddPrompt("prompt", promptTemplate);
            var options = new ActionPlannerOptions<TurnState>(
                modelMock.Object,
                prompts,
                (context, state, planner) => Task.FromResult(new Mock<PromptTemplate>().Object)
            );
            var context = new Mock<ITurnContext>();
            var memory = new TestMemory();
            var planner = new ActionPlanner<TurnState>(options, new TestLoggerFactory());

            // Act
            var result = await planner.CompletePromptAsync(context.Object, memory, promptTemplate, null);

            // Assert
            Assert.Equal(responseMock.Object, result);
        }

        [Fact]
        public async void Test_CompletePromptAsync_DoesNotHavePrompt()
        {
            // Arrange
            var modelMock = new Mock<IPromptCompletionModel>();
            var responseMock = new Mock<PromptResponse>();
            modelMock.Setup(model => model.CompletePromptAsync(
                It.IsAny<ITurnContext>(),
                It.IsAny<IMemory>(),
                It.IsAny<IPromptFunctions<List<string>>>(),
                It.IsAny<ITokenizer>(),
                It.IsAny<PromptTemplate>(),
                It.IsAny<CancellationToken>())).ReturnsAsync(responseMock.Object);
            var promptTemplate = new PromptTemplate(
                "prompt",
                new(new() { })
            );
            var prompts = new PromptManager();
            var options = new ActionPlannerOptions<TurnState>(
                modelMock.Object,
                prompts,
                (context, state, planner) => Task.FromResult(new Mock<PromptTemplate>().Object)
            );
            var context = new Mock<ITurnContext>();
            var memory = new TestMemory();
            var planner = new ActionPlanner<TurnState>(options, new TestLoggerFactory());

            // Act
            var result = await planner.CompletePromptAsync(context.Object, memory, promptTemplate, null);

            // Assert
            Assert.True(prompts.HasPrompt("prompt"));
            Assert.Equal(responseMock.Object, result);
        }

        [Fact]
        public async void Test_ContinueTaskAsync_PromptResponseStatusError()
        {
            // Arrange
            var modelMock = new Mock<IPromptCompletionModel>();
            var response = new PromptResponse()
            {
                Status = PromptResponseStatus.Error,
                Error = new("failed")
            };
            modelMock.Setup(model => model.CompletePromptAsync(
                It.IsAny<ITurnContext>(),
                It.IsAny<IMemory>(),
                It.IsAny<IPromptFunctions<List<string>>>(),
                It.IsAny<ITokenizer>(),
                It.IsAny<PromptTemplate>(),
                It.IsAny<CancellationToken>())).ReturnsAsync(response);
            var promptTemplate = new PromptTemplate(
                "prompt",
                new(new() { })
            );
            var prompts = new PromptManager();
            prompts.AddPrompt("prompt", promptTemplate);
            var options = new ActionPlannerOptions<TurnState>(
                modelMock.Object,
                prompts,
                (context, state, planner) => Task.FromResult(promptTemplate)
            );
            var turnContext = TurnStateConfig.CreateConfiguredTurnContext();
            var state = new TurnState();
            await state.LoadStateAsync(null, turnContext);
            state.Temp.Input = "test";
            var planner = new ActionPlanner<TurnState>(options, new TestLoggerFactory());
            var ai = new AI<TurnState>(new(planner));

            // Act
            var exception = await Assert.ThrowsAsync<Exception>(async () => await planner.ContinueTaskAsync(turnContext, state, ai));

            // Assert
            Assert.Equal("failed", exception.Message);
        }

        [Fact]
        public async void Test_ContinueTaskAsync_PromptResponseStatusError_ErrorNull()
        {
            // Arrange
            var modelMock = new Mock<IPromptCompletionModel>();
            var response = new PromptResponse()
            {
                Status = PromptResponseStatus.Error
            };
            modelMock.Setup(model => model.CompletePromptAsync(
                It.IsAny<ITurnContext>(),
                It.IsAny<IMemory>(),
                It.IsAny<IPromptFunctions<List<string>>>(),
                It.IsAny<ITokenizer>(),
                It.IsAny<PromptTemplate>(),
                It.IsAny<CancellationToken>())).ReturnsAsync(response);
            var promptTemplate = new PromptTemplate(
                "prompt",
                new(new() { })
            );
            var prompts = new PromptManager();
            prompts.AddPrompt("prompt", promptTemplate);
            var options = new ActionPlannerOptions<TurnState>(
                modelMock.Object,
                prompts,
                (context, state, planner) => Task.FromResult(promptTemplate)
            );
            var turnContext = TurnStateConfig.CreateConfiguredTurnContext();
            var state = new TurnState();
            await state.LoadStateAsync(null, turnContext);
            state.Temp.Input = "test";
            var planner = new ActionPlanner<TurnState>(options, new TestLoggerFactory());
            var ai = new AI<TurnState>(new(planner));

            // Act
            var exception = await Assert.ThrowsAsync<Exception>(async () => await planner.ContinueTaskAsync(turnContext, state, ai));

            // Assert
            Assert.Equal("[Action Planner]: an error has occurred", exception.Message);
        }

        [Fact]
        public async void Test_ContinueTaskAsync_PlanNull()
        {
            // Arrange
            var modelMock = new Mock<IPromptCompletionModel>();
            var response = new PromptResponse()
            {
                Status = PromptResponseStatus.Success
            };
            modelMock.Setup(model => model.CompletePromptAsync(
                It.IsAny<ITurnContext>(),
                It.IsAny<IMemory>(),
                It.IsAny<IPromptFunctions<List<string>>>(),
                It.IsAny<ITokenizer>(),
                It.IsAny<PromptTemplate>(),
                It.IsAny<CancellationToken>())).ReturnsAsync(response);
            var promptTemplate = new PromptTemplate(
                "prompt",
                new(new() { })
            );
            var augmentationMock = new Mock<IAugmentation>();
            Plan? plan = null;
            augmentationMock.Setup(augmentation => augmentation.CreatePlanFromResponseAsync(
                It.IsAny<ITurnContext>(),
                It.IsAny<IMemory>(),
                It.IsAny<PromptResponse>(),
                It.IsAny<CancellationToken>())).ReturnsAsync(plan);
            augmentationMock.Setup(augmentation => augmentation.ValidateResponseAsync(
                It.IsAny<ITurnContext>(),
                It.IsAny<IMemory>(),
                It.IsAny<ITokenizer>(),
                It.IsAny<PromptResponse>(),
                It.IsAny<int>(),
                It.IsAny<CancellationToken>())).ReturnsAsync(new Validation { Valid = true });
            promptTemplate.Augmentation = augmentationMock.Object;
            var prompts = new PromptManager();
            prompts.AddPrompt("prompt", promptTemplate);
            var options = new ActionPlannerOptions<TurnState>(
                modelMock.Object,
                prompts,
                (context, state, planner) => Task.FromResult(promptTemplate)
            );
            var turnContext = TurnStateConfig.CreateConfiguredTurnContext();
            var state = new TurnState();
            await state.LoadStateAsync(null, turnContext);
            state.Temp.Input = "test";
            var planner = new ActionPlanner<TurnState>(options, new TestLoggerFactory());
            var ai = new AI<TurnState>(new(planner));

            // Act
            var exception = await Assert.ThrowsAsync<Exception>(async () => await planner.ContinueTaskAsync(turnContext, state, ai));

            // Assert
            Assert.Equal("[Action Planner]: failed to create plan", exception.Message);
        }

        [Fact]
        public async void Test_ContinueTaskAsync()
        {
            // Arrange
            var modelMock = new Mock<IPromptCompletionModel>();
            var response = new PromptResponse()
            {
                Status = PromptResponseStatus.Success
            };
            modelMock.Setup(model => model.CompletePromptAsync(
                It.IsAny<ITurnContext>(),
                It.IsAny<IMemory>(),
                It.IsAny<IPromptFunctions<List<string>>>(),
                It.IsAny<ITokenizer>(),
                It.IsAny<PromptTemplate>(),
                It.IsAny<CancellationToken>())).ReturnsAsync(response);
            var promptTemplate = new PromptTemplate(
                "prompt",
                new(new() { })
            );
            var augmentationMock = new Mock<IAugmentation>();
            var planMock = new Mock<Plan>();
            augmentationMock.Setup(augmentation => augmentation.CreatePlanFromResponseAsync(
                It.IsAny<ITurnContext>(),
                It.IsAny<IMemory>(),
                It.IsAny<PromptResponse>(),
                It.IsAny<CancellationToken>())).ReturnsAsync(planMock.Object);
            augmentationMock.Setup(augmentation => augmentation.ValidateResponseAsync(
                It.IsAny<ITurnContext>(),
                It.IsAny<IMemory>(),
                It.IsAny<ITokenizer>(),
                It.IsAny<PromptResponse>(),
                It.IsAny<int>(),
                It.IsAny<CancellationToken>())).ReturnsAsync(new Validation { Valid = true });
            promptTemplate.Augmentation = augmentationMock.Object;
            var prompts = new PromptManager();
            prompts.AddPrompt("prompt", promptTemplate);
            var options = new ActionPlannerOptions<TurnState>(
                modelMock.Object,
                prompts,
                (context, state, planner) => Task.FromResult(promptTemplate)
            );
            var turnContext = TurnStateConfig.CreateConfiguredTurnContext();
            var state = new TurnState();
            await state.LoadStateAsync(null, turnContext);
            state.Temp.Input = "test";
            var planner = new ActionPlanner<TurnState>(options, new TestLoggerFactory());
            var ai = new AI<TurnState>(new(planner));

            // Act
            var result = await planner.ContinueTaskAsync(turnContext, state, ai);

            // Assert
            Assert.Equal(planMock.Object, result);
        }

        [Fact]
        public async void Test_BeginTaskAsync_PromptResponseStatusError()
        {
            // Arrange
            var modelMock = new Mock<IPromptCompletionModel>();
            var response = new PromptResponse()
            {
                Status = PromptResponseStatus.Error,
                Error = new("failed")
            };
            modelMock.Setup(model => model.CompletePromptAsync(
                It.IsAny<ITurnContext>(),
                It.IsAny<IMemory>(),
                It.IsAny<IPromptFunctions<List<string>>>(),
                It.IsAny<ITokenizer>(),
                It.IsAny<PromptTemplate>(),
                It.IsAny<CancellationToken>())).ReturnsAsync(response);
            var promptTemplate = new PromptTemplate(
                "prompt",
                new(new() { })
            );
            var prompts = new PromptManager();
            prompts.AddPrompt("prompt", promptTemplate);
            var options = new ActionPlannerOptions<TurnState>(
                modelMock.Object,
                prompts,
                (context, state, planner) => Task.FromResult(promptTemplate)
            );
            var turnContext = TurnStateConfig.CreateConfiguredTurnContext();
            var state = new TurnState();
            await state.LoadStateAsync(null, turnContext);
            state.Temp.Input = "test";
            var planner = new ActionPlanner<TurnState>(options, new TestLoggerFactory());
            var ai = new AI<TurnState>(new(planner));

            // Act
            var exception = await Assert.ThrowsAsync<Exception>(async () => await planner.BeginTaskAsync(turnContext, state, ai));

            // Assert
            Assert.Equal("failed", exception.Message);
        }

        [Fact]
        public async void Test_BeginTaskAsync_PromptResponseStatusError_ErrorNull()
        {
            // Arrange
            var modelMock = new Mock<IPromptCompletionModel>();
            var response = new PromptResponse()
            {
                Status = PromptResponseStatus.Error
            };
            modelMock.Setup(model => model.CompletePromptAsync(
                It.IsAny<ITurnContext>(),
                It.IsAny<IMemory>(),
                It.IsAny<IPromptFunctions<List<string>>>(),
                It.IsAny<ITokenizer>(),
                It.IsAny<PromptTemplate>(),
                It.IsAny<CancellationToken>())).ReturnsAsync(response);
            var promptTemplate = new PromptTemplate(
                "prompt",
                new(new() { })
            );
            var prompts = new PromptManager();
            prompts.AddPrompt("prompt", promptTemplate);
            var options = new ActionPlannerOptions<TurnState>(
                modelMock.Object,
                prompts,
                (context, state, planner) => Task.FromResult(promptTemplate)
            );
            var turnContext = TurnStateConfig.CreateConfiguredTurnContext();
            var state = new TurnState();
            await state.LoadStateAsync(null, turnContext);
            state.Temp.Input = "test";
            var planner = new ActionPlanner<TurnState>(options, new TestLoggerFactory());
            var ai = new AI<TurnState>(new(planner));

            // Act
            var exception = await Assert.ThrowsAsync<Exception>(async () => await planner.BeginTaskAsync(turnContext, state, ai));

            // Assert
            Assert.Equal("[Action Planner]: an error has occurred", exception.Message);
        }

        [Fact]
        public async void Test_BeginTaskAsync_PlanNull()
        {
            // Arrange
            var modelMock = new Mock<IPromptCompletionModel>();
            var response = new PromptResponse()
            {
                Status = PromptResponseStatus.Success
            };
            modelMock.Setup(model => model.CompletePromptAsync(
                It.IsAny<ITurnContext>(),
                It.IsAny<IMemory>(),
                It.IsAny<IPromptFunctions<List<string>>>(),
                It.IsAny<ITokenizer>(),
                It.IsAny<PromptTemplate>(),
                It.IsAny<CancellationToken>())).ReturnsAsync(response);
            var promptTemplate = new PromptTemplate(
                "prompt",
                new(new() { })
            );
            var augmentationMock = new Mock<IAugmentation>();
            Plan? plan = null;
            augmentationMock.Setup(augmentation => augmentation.CreatePlanFromResponseAsync(
                It.IsAny<ITurnContext>(),
                It.IsAny<IMemory>(),
                It.IsAny<PromptResponse>(),
                It.IsAny<CancellationToken>())).ReturnsAsync(plan);
            augmentationMock.Setup(augmentation => augmentation.ValidateResponseAsync(
                It.IsAny<ITurnContext>(),
                It.IsAny<IMemory>(),
                It.IsAny<ITokenizer>(),
                It.IsAny<PromptResponse>(),
                It.IsAny<int>(),
                It.IsAny<CancellationToken>())).ReturnsAsync(new Validation { Valid = true });
            promptTemplate.Augmentation = augmentationMock.Object;
            var prompts = new PromptManager();
            prompts.AddPrompt("prompt", promptTemplate);
            var options = new ActionPlannerOptions<TurnState>(
                modelMock.Object,
                prompts,
                (context, state, planner) => Task.FromResult(promptTemplate)
            );
            var turnContext = TurnStateConfig.CreateConfiguredTurnContext();
            var state = new TurnState();
            await state.LoadStateAsync(null, turnContext);
            state.Temp.Input = "test";
            var planner = new ActionPlanner<TurnState>(options, new TestLoggerFactory());
            var ai = new AI<TurnState>(new(planner));

            // Act
            var exception = await Assert.ThrowsAsync<Exception>(async () => await planner.BeginTaskAsync(turnContext, state, ai));

            // Assert
            Assert.Equal("[Action Planner]: failed to create plan", exception.Message);
        }

        [Fact]
        public async void Test_BeginTaskAsync()
        {
            // Arrange
            var modelMock = new Mock<IPromptCompletionModel>();
            var response = new PromptResponse()
            {
                Status = PromptResponseStatus.Success
            };
            modelMock.Setup(model => model.CompletePromptAsync(
                It.IsAny<ITurnContext>(),
                It.IsAny<IMemory>(),
                It.IsAny<IPromptFunctions<List<string>>>(),
                It.IsAny<ITokenizer>(),
                It.IsAny<PromptTemplate>(),
                It.IsAny<CancellationToken>())).ReturnsAsync(response);
            var promptTemplate = new PromptTemplate(
                "prompt",
                new(new() { })
            );
            var augmentationMock = new Mock<IAugmentation>();
            var planMock = new Mock<Plan>();
            augmentationMock.Setup(augmentation => augmentation.CreatePlanFromResponseAsync(
                It.IsAny<ITurnContext>(),
                It.IsAny<IMemory>(),
                It.IsAny<PromptResponse>(),
                It.IsAny<CancellationToken>())).ReturnsAsync(planMock.Object);
            augmentationMock.Setup(augmentation => augmentation.ValidateResponseAsync(
                It.IsAny<ITurnContext>(),
                It.IsAny<IMemory>(),
                It.IsAny<ITokenizer>(),
                It.IsAny<PromptResponse>(),
                It.IsAny<int>(),
                It.IsAny<CancellationToken>())).ReturnsAsync(new Validation { Valid = true });
            promptTemplate.Augmentation = augmentationMock.Object;
            var prompts = new PromptManager();
            prompts.AddPrompt("prompt", promptTemplate);
            var options = new ActionPlannerOptions<TurnState>(
                modelMock.Object,
                prompts,
                (context, state, planner) => Task.FromResult(promptTemplate)
            );
            var turnContext = TurnStateConfig.CreateConfiguredTurnContext();
            var state = new TurnState();
            await state.LoadStateAsync(null, turnContext);
            state.Temp.Input = "test";
            var planner = new ActionPlanner<TurnState>(options, new TestLoggerFactory());
            var ai = new AI<TurnState>(new(planner));

            // Act
            var result = await planner.BeginTaskAsync(turnContext, state, ai);

            // Assert
            Assert.Equal(planMock.Object, result);
        }

        [Fact]
        public void Test_Get_Model()
        {
            // Arrange
            var modelMock = new Mock<IPromptCompletionModel>();
            var prompts = new PromptManager();
            var promptTemplate = new PromptTemplate(
                "prompt",
                new(new() { })
            );
            var options = new ActionPlannerOptions<TurnState>(
                modelMock.Object,
                prompts,
                (context, state, planner) => Task.FromResult(promptTemplate)
            );
            var planner = new ActionPlanner<TurnState>(options, new TestLoggerFactory());

            // Act
            var result = planner.Model;

            // Assert
            Assert.Equal(options.Model, result);
        }

        [Fact]
        public void Test_Get_Prompts()
        {
            // Arrange
            var modelMock = new Mock<IPromptCompletionModel>();
            var prompts = new PromptManager();
            var promptTemplate = new PromptTemplate(
                "prompt",
                new(new() { })
            );
            var options = new ActionPlannerOptions<TurnState>(
                modelMock.Object,
                prompts,
                (context, state, planner) => Task.FromResult(promptTemplate)
            );
            var planner = new ActionPlanner<TurnState>(options, new TestLoggerFactory());

            // Act
            var result = planner.Prompts;

            // Assert
            Assert.Equal(options.Prompts, result);
        }

        [Fact]
        public void Test_Get_DefaultPrompt()
        {
            // Arrange
            var modelMock = new Mock<IPromptCompletionModel>();
            var prompts = new PromptManager();
            var promptTemplate = new PromptTemplate(
                "prompt",
                new(new() { })
            );
            var options = new ActionPlannerOptions<TurnState>(
                modelMock.Object,
                prompts,
                (context, state, planner) => Task.FromResult(promptTemplate)
            );
            var planner = new ActionPlanner<TurnState>(options, new TestLoggerFactory());

            // Act
            var result = planner.DefaultPrompt;

            // Assert
            Assert.Equal(options.DefaultPrompt, result);
        }

        private sealed class TestMemory : IMemory
        {
            public Dictionary<string, object> Values { get; set; } = new Dictionary<string, object>();

            public void DeleteValue(string path)
            {
                Values.Remove(path);
            }

            public object? GetValue(string path)
            {
                return Values.GetValueOrDefault(path);
            }

            public bool HasValue(string path)
            {
                return Values.ContainsKey(path);
            }

            public void SetValue(string path, object value)
            {
                Values[path] = value;
            }
        }
    }
}
