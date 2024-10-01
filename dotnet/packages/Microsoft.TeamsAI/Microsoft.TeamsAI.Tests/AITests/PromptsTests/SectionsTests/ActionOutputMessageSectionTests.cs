using Microsoft.Teams.AI.AI.Models;
using Microsoft.Teams.AI.AI.Prompts.Sections;
using Microsoft.Teams.AI.State;
using Microsoft.Teams.AI.Tests.TestUtils;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Microsoft.Teams.AI.Tests.AITests.PromptsTests.SectionsTests
{
    public class ActionOutputMessageSectionTests
    {
        [Fact]
        public async Task Test_RenderAsMessages_NoHistory_ReturnsEmptyList()
        {
            // Arrange
            var historyVariable = "temp.history";
            var turnContext = TurnStateConfig.CreateConfiguredTurnContext();
            var turnState = await TurnStateConfig.GetTurnStateWithConversationStateAsync(turnContext);
            turnState.SetValue(historyVariable, new List<ChatMessage>() { });
            turnState.SetValue(TempState.ActionOutputsKey, new Dictionary<string, string>());
            var section = new ActionOutputMessageSection(historyVariable);

            // Act
            var sections = await section.RenderAsMessagesAsync(turnContext, turnState, null!, null!, 0);

            // Assert
            Assert.Empty(sections.Output);
        }

        [Fact]
        public async Task Test_RenderAsMessages_HistoryWithoutActionCalls_ReturnsEmptyList()
        {
            // Arrange
            var historyVariable = "temp.history";
            var turnContext = TurnStateConfig.CreateConfiguredTurnContext();
            var turnState = await TurnStateConfig.GetTurnStateWithConversationStateAsync(turnContext);
            turnState.SetValue(historyVariable, new List<ChatMessage>() { new ChatMessage(ChatRole.Assistant) });
            turnState.SetValue(TempState.ActionOutputsKey, new Dictionary<string, string>());
            var section = new ActionOutputMessageSection(historyVariable);

            // Act
            var sections = await section.RenderAsMessagesAsync(turnContext, turnState, null!, null!, 0);

            // Assert
            Assert.Empty(sections.Output);
        }

        [Fact]
        public async Task Test_RenderAsMessages_WithActionCalls_AddsToolMessage()
        {
            // Arrange
            var historyVariable = "temp.history";
            var turnContext = TurnStateConfig.CreateConfiguredTurnContext();
            var turnState = await TurnStateConfig.GetTurnStateWithConversationStateAsync(turnContext);
            turnState.SetValue(historyVariable, new List<ChatMessage>() { 
                new ChatMessage(ChatRole.Assistant) { 
                    ActionCalls = new List<ActionCall> { new ActionCall("testId", new ActionFunction("testName", "{}")) }
                }
            });
            turnState.SetValue(TempState.ActionOutputsKey, new Dictionary<string, string>()
            {
                {  "testId", "testOutput" } 
            });
            var section = new ActionOutputMessageSection(historyVariable);

            // Act
            var sections = await section.RenderAsMessagesAsync(turnContext, turnState, null!, null!, 0);

            // Assert
            Assert.Single(sections.Output);
            Assert.Equal("testOutput", sections.Output[0].Content);
        }

        [Fact]
        public async Task Test_RenderAsMessages_WithInvalidActionCalls_AddsToolMessage_WithEmptyOutput()
        {
            // Arrange
            var historyVariable = "temp.history";
            var turnContext = TurnStateConfig.CreateConfiguredTurnContext();
            var turnState = await TurnStateConfig.GetTurnStateWithConversationStateAsync(turnContext);
            turnState.SetValue(historyVariable, new List<ChatMessage>() {
                new ChatMessage(ChatRole.Assistant) {
                    ActionCalls = new List<ActionCall> { new ActionCall("testId", new ActionFunction("testName", "{}")) }
                }
            });
            turnState.SetValue(TempState.ActionOutputsKey, new Dictionary<string, string>()
            {
                {  "InvalidTestId", "testOutput" }
            });
            var section = new ActionOutputMessageSection(historyVariable);

            // Act
            var sections = await section.RenderAsMessagesAsync(turnContext, turnState, null!, null!, 0);

            // Assert
            Assert.Empty(sections.Output);
        }
    }
}
