using Microsoft.Bot.Builder;
using Microsoft.Teams.AI.AI.Augmentations;
using Microsoft.Teams.AI.AI.Models;
using Microsoft.Teams.AI.AI.Planners;
using Microsoft.Teams.AI.AI.Prompts;
using Microsoft.Teams.AI.State;
using Microsoft.Teams.AI.Tests.TestUtils;

namespace Microsoft.Teams.AI.Tests.AITests.Augmentations
{
    public class ToolsAugmentationTests
    {
        [Fact]
        public async void Test_CreatePlanFromResponse_NoActionCalls_CreateSayCommand()
        {
            // Arrange
            ToolsAugmentation augmentation = new ToolsAugmentation();
            TurnContext context = TurnStateConfig.CreateConfiguredTurnContext();
            TurnState state = await TurnStateConfig.GetTurnStateWithConversationStateAsync(context);
            PromptResponse response = new PromptResponse();
            response.Message = new ChatMessage(ChatRole.Assistant) { Content = "testMessage" };

            // Act
            Plan? plan = await augmentation.CreatePlanFromResponseAsync(context, state, response);

            // Assert
            Assert.NotNull(plan);
            Assert.Single(plan.Commands);

            var sayCommand = plan.Commands[0] as PredictedSayCommand;
            Assert.NotNull(sayCommand);
            Assert.Equal("testMessage", sayCommand.Response.Content);
        }

        [Fact]
        public async void Test_CreatePlanFromResponse_OneActionCall()
        {
            // Arrange
            ToolsAugmentation augmentation = new ToolsAugmentation();
            TurnContext context = TurnStateConfig.CreateConfiguredTurnContext();
            TurnState state = await TurnStateConfig.GetTurnStateWithConversationStateAsync(context);
            PromptResponse response = new PromptResponse();
            response.Message = new ChatMessage(ChatRole.Assistant) { 
                Content = "testMessage",
                ActionCalls = new List<ActionCall>() { 
                    new ActionCall("id", new ActionFunction("testFunction", "{ \"key\": \"value\" }")) 
                }
            };
            

            // Act
            Plan? plan = await augmentation.CreatePlanFromResponseAsync(context, state, response);

            // Assert
            Assert.NotNull(plan);
            Assert.Single(plan.Commands);

            var doCommand = plan.Commands[0] as PredictedDoCommand;
            Assert.NotNull(doCommand);
            Assert.Equal("testFunction", doCommand.Action);
            Assert.Equal("value", doCommand.Parameters!["key"]);
        }

        [Fact]
        public async void Test_CreatePlanFromTesponse_MultipleActionCalls()
        {
            // Arrange
            ToolsAugmentation augmentation = new ToolsAugmentation();
            TurnContext context = TurnStateConfig.CreateConfiguredTurnContext();
            TurnState state = await TurnStateConfig.GetTurnStateWithConversationStateAsync(context);
            PromptResponse response = new PromptResponse();
            response.Message = new ChatMessage(ChatRole.Assistant)
            {
                Content = "testMessage",
                ActionCalls = new List<ActionCall>() {
                    new ActionCall("id1", new ActionFunction("testFunction1", "{ \"key1\": \"value1\" }")),
                    new ActionCall("id2", new ActionFunction("testFunction2", "{ \"key2\": \"value2\" }")),
                }
            };


            // Act
            Plan? plan = await augmentation.CreatePlanFromResponseAsync(context, state, response);

            // Assert
            Assert.NotNull(plan);
            Assert.Equal(2, plan.Commands.Count);

            var doCommand1 = plan.Commands[0] as PredictedDoCommand;
            Assert.NotNull(doCommand1);
            Assert.Equal("testFunction1", doCommand1.Action);
            Assert.Equal("value1", doCommand1.Parameters!["key1"]);

            var doCommand2 = plan.Commands[1] as PredictedDoCommand;
            Assert.NotNull(doCommand2);
            Assert.Equal("testFunction2", doCommand2.Action);
            Assert.Equal("value2", doCommand2.Parameters!["key2"]);
        }
    }
}
