using System.Reflection;
using Microsoft.Bot.Builder.M365.AI.Prompt;
using Microsoft.Bot.Builder.M365.Exceptions;
using Microsoft.Bot.Schema;
using Microsoft.SemanticKernel.TemplateEngine;
using Moq;

namespace Microsoft.Bot.Builder.M365.Tests.AI
{
    // TODO: Complete tests once turn state infrastructure is implemented
    public class PromptManagerTests
    {
        [Fact]
        public void AddFunction_Simple()
        {
            // Arrange
            var promptManager = new PromptManager<TurnState>();
            var turnContextMock = new Mock<ITurnContext>();
            var turnStateMock = new Mock<TurnState>();
            var name = "promptFunctionName";
            PromptFunction<TurnState> promptFunction = (ITurnContext turnContext, TurnState turnState) => Task.FromResult(name);

            // Act
            promptManager.AddFunction(name, promptFunction);

            // Assert
            Assert.Equal(promptManager.InvokeFunction(turnContextMock.Object, turnStateMock.Object, name).Result, name);
        }

        [Fact]
        public void AddFunction_AlreadyExists_AllowOverride()
        {
            // Arrange
            var promptManager = new PromptManager<TurnState>();
            var turnContextMock = new Mock<ITurnContext>();
            var turnStateMock = new Mock<TurnState>();
            var name = "promptFunctionName";
            var nameOverride = "promptFunctionNameOverride";
            PromptFunction<TurnState> promptFunction = (ITurnContext turnContext, TurnState turnState) => Task.FromResult(name);
            PromptFunction<TurnState> promptFunctionOverride = (ITurnContext turnContext, TurnState turnState) => Task.FromResult(nameOverride);

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
            var promptManager = new PromptManager<TurnState>();
            var turnContextMock = new Mock<ITurnContext>();
            var turnStateMock = new Mock<TurnState>();
            var name = "promptFunctionName";
            var nameOverride = "promptFunctionNameOverride";
            Task<string> promptFunction(ITurnContext turnContext, TurnState turnState) => Task.FromResult(name);
            Task<string> promptFunctionOverride(ITurnContext turnContext, TurnState turnState) => Task.FromResult(nameOverride);

            // Act
            promptManager.AddFunction(name, promptFunction, false);
            var exception = Assert.Throws<PromptManagerException>(() => promptManager.AddFunction(name, promptFunctionOverride, false));

            // Assert
            Assert.Equal(exception.Message, $"Attempting to update a previously registered function `{name}`");
        }

        [Fact]
        public void AddPromptTemplate_Simple()
        {
            // Arrange
            var promptManager = new PromptManager<TurnState>();
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
            var promptManager = new PromptManager<TurnState>();
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
            var exception = Assert.Throws<PromptManagerException>(() => promptManager.AddPromptTemplate(name, promptTemplate));

            // Assert
            Assert.Equal(exception.Message, $"Text template `{name}` already exists.");
        }

        [Fact]
        public void LoadPromptTemplate_FromCollection()
        {
            // Arrange
            var promptManager = new PromptManager<TurnState>();
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
            var promptManager = new PromptManager<TurnState>(directoryPath);
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
            var promptManager = new PromptManager<TurnState>(directoryPath);
            var name = "invalidPromptTemplateFolder";

            // Act
            var exception = Assert.Throws<PromptManagerException>(() => promptManager.LoadPromptTemplate(name));

            // Assert 
            Assert.Equal(exception.Message, $"Directory doesn't exist `{directoryPath}\\{name}`");
        }

        [Fact]
        public async void RenderPrompt_PlainText()
        {
            // Arrange
            var promptManager = new PromptManager<TurnState>();
            var botAdapterStub = Mock.Of<BotAdapter>();
            var turnContextMock = new Mock<TurnContext>(botAdapterStub, new Activity { Text = "user message" });

            var turnStateMock = new Mock<TurnState>();
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
            var renderedPrompt = await promptManager.RenderPrompt(turnContextMock.Object, turnStateMock.Object, promptTemplate);

            // Assert
            Assert.Equal(renderedPrompt.Text, promptString);
        }

        [Fact]
        public async void RenderPrompt_ResolveFunction_FunctionExists()
        {
            // Arrange
            var promptManager = new PromptManager<TurnState>();
            var botAdapterStub = Mock.Of<BotAdapter>();
            var turnContextMock = new Mock<TurnContext>(botAdapterStub, new Activity { Text = "user message" });

            var turnStateMock = new Mock<TurnState>();
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
            PromptFunction<TurnState> promptFunction = (TurnContext, TurnState) => Task.FromResult(output);

            /// Configure prompt
            var promptString = "The output of the function is {{ " + promptFunctionName + " }}";
            var expectedRenderedPrompt = $"The output of the function is {output}";
            var promptTemplate = new PromptTemplate(
                promptString,
                configuration
            );
            
            // Act
            promptManager.AddFunction(promptFunctionName, promptFunction);
            var renderedPrompt = await promptManager.RenderPrompt(turnContextMock.Object, turnStateMock.Object, promptTemplate);

            // Assert
            Assert.Equal(renderedPrompt.Text, expectedRenderedPrompt);
        }

        [Fact]
        public async Task RenderPrompt_ResolveFunction_FunctionNotExists()
        {
            // Arrange
            var promptManager = new PromptManager<TurnState>();
            var botAdapterStub = Mock.Of<BotAdapter>();
            var turnContextMock = new Mock<TurnContext>(botAdapterStub, new Activity { Text = "user message" });

            var turnStateMock = new Mock<TurnState>();
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
            var ex = await Assert.ThrowsAsync<PromptManagerException>(async () => await promptManager.RenderPrompt(turnContextMock.Object, turnStateMock.Object, promptTemplate));

            // Assert
            Assert.Equal("Failed to render prompt: $Function not found: Function `promptFunction` not found", ex.Message);
            Assert.Equal(typeof(TemplateException), ex.InnerException?.GetType());
        }

        [Fact]
        public async void RenderPrompt_ResolveVariable_Exist()
        {

        }

        [Fact]
        public async void RenderPrompt_ResolveVariable_NotExist()
        {

        }

        [Fact]
        public async void RenderPrompt_ResolveVariable_NestedObject()
        {

        }

        [Fact]
        public async void RenderPrompt_ResolveVariable_NestedObject_GreaterThanLevel2Depth_ShouldFail()
        {
            // {{ $state.conversation.level2.level3 }} is not allowed
        }

        [Fact]
        public async void RenderPrompt_WithFunctionAndVariableReference()
        {

        }
    }
}
