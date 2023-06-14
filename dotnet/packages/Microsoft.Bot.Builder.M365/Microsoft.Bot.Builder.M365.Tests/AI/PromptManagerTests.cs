using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Microsoft.Bot.Builder.M365.AI.Prompt;
using Microsoft.Bot.Builder.M365.Exceptions;
using Moq;

namespace Microsoft.Bot.Builder.M365.Tests.AI
{
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

        }

        [Fact]
        public void AddPromptTemplate_AlreadyExists()
        {

        }

        [Fact]
        public void LoadPromptTemplate_FromCollection()
        {

        }

        [Fact]
        public void LoadPromptTemplate_FromFilesystem()
        {

        }

        [Fact]
        public void LoadPromptTemplate_FromFilesystem_NoPromptFolderConfigured()
        {

        }
    }
}
