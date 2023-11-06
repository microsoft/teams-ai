using System.Reflection;
using Microsoft.Teams.AI.AI.Prompt;
using Microsoft.Teams.AI.Exceptions;
using Microsoft.Bot.Schema;
using Moq;
using Microsoft.Teams.AI.State;
using Microsoft.Teams.AI.Tests.TestUtils;
using Microsoft.Bot.Builder;
using Microsoft.SemanticKernel.Diagnostics;

namespace Microsoft.Teams.AI.Tests.AITests
{
    public class PromptManagerTests
    {
        [Fact]
        public void AddFunction_Simple()
        {
            // Arrange
            var promptManager = new PromptManager<TestTurnState>();
            var turnContextMock = new Mock<ITurnContext>();
            var turnStateMock = new Mock<TestTurnState>();
            var name = "promptFunctionName";
            PromptFunction<TestTurnState> promptFunction = (turnContext, turnState) => Task.FromResult(name);

            // Act
            promptManager.AddFunction(name, promptFunction);

            // Assert
            Assert.Equal(promptManager.InvokeFunction(turnContextMock.Object, turnStateMock.Object, name).Result, name);
        }

        [Fact]
        public void AddFunction_AlreadyExists_AllowOverride()
        {
            // Arrange
            var promptManager = new PromptManager<TestTurnState>();
            var turnContextMock = new Mock<ITurnContext>();
            var turnStateMock = new Mock<TestTurnState>();
            var name = "promptFunctionName";
            var nameOverride = "promptFunctionNameOverride";
            PromptFunction<TestTurnState> promptFunction = (turnContext, turnState) => Task.FromResult(name);
            PromptFunction<TestTurnState> promptFunctionOverride = (turnContext, turnState) => Task.FromResult(nameOverride);

            // Act
            promptManager.AddFunction(name, promptFunction, false);
            promptManager.AddFunction(name, promptFunctionOverride, true);

            // Assert
            Assert.Equal(promptManager.InvokeFunction(turnContextMock.Object, turnStateMock.Object, name).Result, nameOverride);
        }

        [Fact]
        public void AddFunction_AlreadyExists_NotAllowOverride()
        {
            // Arrange
            var promptManager = new PromptManager<TestTurnState>();
            var turnContextMock = new Mock<ITurnContext>();
            var turnStateMock = new Mock<TestTurnState>();
            var name = "promptFunctionName";
            var nameOverride = "promptFunctionNameOverride";
            Task<string> promptFunction(ITurnContext turnContext, TestTurnState turnState) => Task.FromResult(name);
            Task<string> promptFunctionOverride(ITurnContext turnContext, TestTurnState turnState) => Task.FromResult(nameOverride);

            // Act
            promptManager.AddFunction(name, promptFunction, false);
            var exception = Assert.Throws<InvalidOperationException>(() => promptManager.AddFunction(name, promptFunctionOverride, false));

            // Assert
            Assert.Equal(exception.Message, $"Attempting to update a previously registered function `{name}`");
        }

        [Fact]
        public void AddPromptTemplate_Simple()
        {
            // Arrange
            var promptManager = new PromptManager<TestTurnState>();
            var name = "promptTemplateName";
            var promptTemplate = new PromptTemplate(
                "template string",
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
            promptManager.AddPromptTemplate(name, promptTemplate);

            // Assert
            Assert.Equal(promptManager.LoadPromptTemplate(name), promptTemplate);
        }

        [Fact]
        public void AddPromptTemplate_AlreadyExists()
        {
            // Arrange
            var promptManager = new PromptManager<TestTurnState>();
            var name = "promptTemplateName";
            var promptTemplate = new PromptTemplate(
                "template string",
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
            promptManager.AddPromptTemplate(name, promptTemplate);
            var exception = Assert.Throws<InvalidOperationException>(() => promptManager.AddPromptTemplate(name, promptTemplate));

            // Assert
            Assert.Equal(exception.Message, $"Text template `{name}` already exists.");
        }

        [Fact]
        public void LoadPromptTemplate_FromCollection()
        {
            // Arrange
            var promptManager = new PromptManager<TestTurnState>();
            var name = "promptTemplateName";
            var promptTemplate = new PromptTemplate(
                "template string",
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
            promptManager.AddPromptTemplate(name, promptTemplate);
            var loadedPromptTemplate = promptManager.LoadPromptTemplate(name);

            // Assert
            Assert.Equal(loadedPromptTemplate, promptTemplate);
        }

        [Fact]
        public void LoadPromptTemplate_FromFilesystem()
        {
            // Arrange
            var currentAssemblyDirectory = Path.GetDirectoryName(Assembly.GetExecutingAssembly().Location);

            if (string.IsNullOrWhiteSpace(currentAssemblyDirectory))
            {
                throw new InvalidOperationException("Unable to determine current assembly directory.");
            }

            var directoryPath = Path.GetFullPath(Path.Combine(currentAssemblyDirectory, $"../../../AITests/prompts"));
            var promptManager = new PromptManager<TestTurnState>(directoryPath);
            var name = "promptTemplateFolder";
            var expectedPromptTemplate = new PromptTemplate(
                "This is a prompt template string.",
                new PromptTemplateConfiguration
                {
                    Schema = 1,
                    Description = "A bot that plays a game of 20 questions",
                    Type = "completion",
                    Completion =
                    {
                        MaxTokens = 256,
                        Temperature = 0.7,
                        TopP = 0.0,
                        PresencePenalty = 0.6,
                        FrequencyPenalty = 0.0,
                    },
                    DefaultBackends =
                    {
                        "text-davinci-003"
                    },
                }
            );

            // Act
            var loadedPromptTemplate = promptManager.LoadPromptTemplate(name);

            // Assert
            // Comparison for every property in this object
            Assert.Equal(loadedPromptTemplate.Text, expectedPromptTemplate.Text);
            Assert.Equal(loadedPromptTemplate.Configuration.Description, expectedPromptTemplate.Configuration.Description);
            Assert.Equal(loadedPromptTemplate.Configuration.Schema, expectedPromptTemplate.Configuration.Schema);
            Assert.Equal(loadedPromptTemplate.Configuration.DefaultBackends, expectedPromptTemplate.Configuration.DefaultBackends);
            Assert.Equal(loadedPromptTemplate.Configuration.Completion.MaxTokens, expectedPromptTemplate.Configuration.Completion.MaxTokens);
            Assert.Equal(loadedPromptTemplate.Configuration.Completion.Temperature, expectedPromptTemplate.Configuration.Completion.Temperature);
            Assert.Equal(loadedPromptTemplate.Configuration.Completion.TopP, expectedPromptTemplate.Configuration.Completion.TopP);
            Assert.Equal(loadedPromptTemplate.Configuration.Completion.PresencePenalty, expectedPromptTemplate.Configuration.Completion.PresencePenalty);
            Assert.Equal(loadedPromptTemplate.Configuration.Completion.FrequencyPenalty, expectedPromptTemplate.Configuration.Completion.FrequencyPenalty);
        }

        [Fact]
        public void LoadPromptTemplate_FromFilesystem_NoPromptFolderConfigured()
        {
            // Arrange
            var currentAssemblyDirectory = Path.GetDirectoryName(Assembly.GetExecutingAssembly().Location);

            if (string.IsNullOrWhiteSpace(currentAssemblyDirectory))
            {
                throw new InvalidOperationException("Unable to determine current assembly directory.");
            }

            var directoryPath = Path.GetFullPath(Path.Combine(currentAssemblyDirectory, $"../../../AITests/prompts"));
            var promptManager = new PromptManager<TestTurnState>(directoryPath);
            var name = "invalidPromptTemplateFolder";

            // Act
            var exception = Assert.Throws<ArgumentException>(() => promptManager.LoadPromptTemplate(name));

            // Assert 
            Assert.Equal(exception.Message, $"Directory doesn't exist `{directoryPath}\\{name}`");
        }

        [Fact]
        public async void RenderPrompt_PlainText()
        {
            // Arrange
            var promptManager = new PromptManager<TestTurnState>();
            var botAdapterStub = Mock.Of<BotAdapter>();
            var turnContextMock = new Mock<TurnContext>(botAdapterStub, new Activity { Text = "user message" });

            var turnStateMock = new Mock<TestTurnState>();
            var configuration = new PromptTemplateConfiguration
            {
                Completion =
                {
                    MaxTokens = 2000,
                    Temperature = 0.2,
                    TopP = 0.5,
                }
            };

            var name = "promptTemplateName";
            var promptString = "plain template string";
            var promptTemplate = new PromptTemplate(
                promptString,
                configuration
            );

            // Act
            promptManager.AddPromptTemplate(name, promptTemplate);
            var renderedPrompt = await promptManager.RenderPromptAsync(turnContextMock.Object, turnStateMock.Object, promptTemplate);

            // Assert
            Assert.Equal(renderedPrompt.Text, promptString);
        }

        [Fact]
        public async void RenderPrompt_ResolveFunction_FunctionExists()
        {
            // Arrange
            var promptManager = new PromptManager<TestTurnState>();
            var botAdapterStub = Mock.Of<BotAdapter>();
            var turnContextMock = new Mock<TurnContext>(botAdapterStub, new Activity { Text = "user message" });

            var turnStateMock = new Mock<TestTurnState>();
            var configuration = new PromptTemplateConfiguration
            {
                Completion =
                {
                    MaxTokens = 2000,
                    Temperature = 0.2,
                    TopP = 0.5,
                }
            };
            /// Configure function
            var promptFunctionName = "promptFunctionName";
            var output = "output";
            PromptFunction<TestTurnState> promptFunction = (TurnContext, TestTurnState) => Task.FromResult(output);

            /// Configure prompt
            var promptString = "The output of the function is {{ " + promptFunctionName + " }}";
            var expectedRenderedPrompt = $"The output of the function is {output}";
            var promptTemplate = new PromptTemplate(
                promptString,
                configuration
            );

            // Act
            promptManager.AddFunction(promptFunctionName, promptFunction);
            var renderedPrompt = await promptManager.RenderPromptAsync(turnContextMock.Object, turnStateMock.Object, promptTemplate);

            // Assert
            Assert.Equal(renderedPrompt.Text, expectedRenderedPrompt);
        }

        [Fact]
        public async Task RenderPrompt_ResolveFunction_FunctionNotExists()
        {
            // Arrange
            var promptManager = new PromptManager<TestTurnState>();
            var botAdapterStub = Mock.Of<BotAdapter>();
            var turnContextMock = new Mock<TurnContext>(botAdapterStub, new Activity { Text = "user message" });

            var turnStateMock = new Mock<TestTurnState>();
            var configuration = new PromptTemplateConfiguration
            {
                Completion =
                {
                    MaxTokens = 2000,
                    Temperature = 0.2,
                    TopP = 0.5,
                }
            };

            /// Prompt function not configured

            /// Configure prompt
            var name = "promptTemplateName";
            var promptString = "The output of the function is {{ promptFunction }}";
            var promptTemplate = new PromptTemplate(
                promptString,
                configuration
            );

            // Act
            promptManager.AddPromptTemplate(name, promptTemplate);
            var ex = await Assert.ThrowsAsync<TeamsAIException>(async () => await promptManager.RenderPromptAsync(turnContextMock.Object, turnStateMock.Object, promptTemplate));

            // Assert
            Assert.Equal("Failed to render prompt: $Function `promptFunction` not found", ex.Message);
            Assert.Equal(typeof(SKException), ex.InnerException?.GetType());
        }

        [Fact]
        public async void RenderPrompt_ResolveVariable()
        {
            // Arrange
            PromptManager<TestTurnState> promptManager = new();
            var botAdapterStub = Mock.Of<BotAdapter>();
            var turnContextMock = new Mock<TurnContext>(botAdapterStub, new Activity { Text = "user message" });

            var turnStateMock = new Mock<TestTurnState>();
            var configuration = new PromptTemplateConfiguration
            {
                Completion =
                        {
                            MaxTokens = 2000,
                            Temperature = 0.2,
                            TopP = 0.5,
                        }
            };
            /// Configure variable
            var variableKey = "variableName";
            var variableValue = "value";

            /// Configure prompt
            var promptString = "The output of the function is {{ $" + variableKey + " }}";
            var expectedRenderedPrompt = $"The output of the function is {variableValue}";
            var promptTemplate = new PromptTemplate(
                promptString,
                configuration
            );

            // Act
            promptManager.Variables[variableKey] = variableValue;
            var renderedPrompt = await promptManager.RenderPromptAsync(turnContextMock.Object, turnStateMock.Object, promptTemplate);

            // Assert
            Assert.Equal(renderedPrompt.Text, expectedRenderedPrompt);
        }

        [Fact]
        public async void RenderPrompt_ResolveVariable_TestTurnState()
        {
            // Arrange
            var promptManager = new PromptManager<TestTurnState>();
            var botAdapterStub = Mock.Of<BotAdapter>();
            var turnContextMock = new Mock<TurnContext>(botAdapterStub, new Activity { Text = "user message" });

            var turnState = new TestTurnState();
            var inputValue = "input";
            var outputValue = "output";
            var historyValue = "history";
            var tempState = new TempState()
            {
                Input = inputValue,
                Output = outputValue,
                History = historyValue
            };
            turnState.TempStateEntry = new TurnStateEntry<TempState>(tempState);

            var configuration = new PromptTemplateConfiguration
            {
                Completion =
                {
                    MaxTokens = 2000,
                    Temperature = 0.2,
                    TopP = 0.5,
                }
            };

            /// Configure prompt
            var promptString = "{{ $input }}, {{ $output }}, {{ $history }}";
            var expectedRenderedPrompt = $"{inputValue}, {outputValue}, {historyValue}";
            var promptTemplate = new PromptTemplate(
                promptString,
                configuration
            );

            // Act
            var renderedPrompt = await promptManager.RenderPromptAsync(turnContextMock.Object, turnState, promptTemplate);

            // Assert
            Assert.Equal(renderedPrompt.Text, expectedRenderedPrompt);
        }

        [Fact]
        public async void RenderPrompt_ResolveVariable_CustomTurnState()
        {
            // Arrange
            var promptManager = new PromptManager<CustomTurnState>();
            var botAdapterStub = Mock.Of<BotAdapter>();
            var turnContextMock = new Mock<TurnContext>(botAdapterStub, new Activity { Text = "user message" });

            var turnState = new CustomTurnState();
            var inputValue = "input";
            var outputValue = "output";
            var historyValue = "history";
            var tempState = new CustomTempState()
            {
                Input = inputValue,
                Output = outputValue,
                History = historyValue
            };
            turnState.TempStateEntry = new TurnStateEntry<CustomTempState>(tempState);

            var configuration = new PromptTemplateConfiguration
            {
                Completion =
                {
                    MaxTokens = 2000,
                    Temperature = 0.2,
                    TopP = 0.5,
                }
            };

            /// Configure prompt
            var promptString = "{{ $input }}, {{ $output }}, {{ $history }}";
            var expectedRenderedPrompt = $"{inputValue}, {outputValue}, {historyValue}";
            var promptTemplate = new PromptTemplate(
                promptString,
                configuration
            );

            // Act
            var renderedPrompt = await promptManager.RenderPromptAsync(turnContextMock.Object, turnState, promptTemplate);

            // Assert
            Assert.Equal(renderedPrompt.Text, expectedRenderedPrompt);
        }

        [Fact]
        public async void RenderPrompt_ResolveVariable_NotExist_ShouldResolveToEmptyString()
        {
            // Arrange
            var promptManager = new PromptManager<TestTurnState>();
            var botAdapterStub = Mock.Of<BotAdapter>();
            var turnContextMock = new Mock<TurnContext>(botAdapterStub, new Activity { Text = "user message" });

            var turnStateMock = new Mock<TestTurnState>();

            var configuration = new PromptTemplateConfiguration
            {
                Completion =
                        {
                            MaxTokens = 2000,
                            Temperature = 0.2,
                            TopP = 0.5,
                        }
            };

            /// Configure prompt
            var promptString = "{{ $variable }}";
            var promptTemplate = new PromptTemplate(
                promptString,
                configuration
            );

            // Act
            var renderedPrompt = await promptManager.RenderPromptAsync(turnContextMock.Object, turnStateMock.Object, promptTemplate);

            // Assert
            Assert.Equal("", renderedPrompt.Text);
        }
    }
}
