using Json.Schema;
using Microsoft.Bot.Builder;
using Microsoft.Teams.AI.AI.Augmentations;
using Microsoft.Teams.AI.AI.Models;
using Microsoft.Teams.AI.AI.Planners;
using Microsoft.Teams.AI.AI.Prompts;
using Microsoft.Teams.AI.AI.Tokenizers;
using Microsoft.Teams.AI.State;
using Moq;

namespace Microsoft.Teams.AI.Tests.AITests.Augmentations
{
    public class SequenceAugmentationTests
    {
        [Fact]
        public void Test_CreatePromptSection_NotNull()
        {
            // Arrange
            SequenceAugmentation augmentation = new(new());

            // Act
            var section = augmentation.CreatePromptSection();

            // Assert
            Assert.NotNull(section);
        }

        [Fact]
        public async Task Test_CreatePlanFromResponseAsync_ValidPlan_ShouldSucceed()
        {
            // Arrange
            Mock<ITurnContext> context = new();
            MemoryFork memory = new();
            SequenceAugmentation augmentation = new(new());
            PromptResponse promptResponse = new()
            {
                Status = PromptResponseStatus.Success,
                Message = new(ChatRole.Assistant)
                {
                    Content = @"{
  ""type"": ""plan"",
  ""commands"": [
    {
      ""type"": ""DO"",
      ""action"": ""test""
    },
    {
      ""type"": ""SAY"",
      ""response"": ""hello""
    }
  ]
}",
                    Context = new()
                    {
                        Intent = "test intent",
                        Citations = new List<Citation>
                        {
                            new("content", "title", "url")
                        }
                    }
                }
            };

            // Act
            var plan = await augmentation.CreatePlanFromResponseAsync(context.Object, memory, promptResponse);

            // Assert
            Assert.NotNull(plan);
            Assert.Equal(2, plan.Commands.Count);
            Assert.Equal("DO", plan.Commands[0].Type);
            Assert.Equal("test", (plan.Commands[0] as PredictedDoCommand)?.Action);
            Assert.Equal("SAY", plan.Commands[1].Type);
            Assert.Equal("hello", (plan.Commands[1] as PredictedSayCommand)?.Response.Content);
            Assert.Equal("test intent", (plan.Commands[1] as PredictedSayCommand)?.Response.Context?.Intent);
            Assert.Equal("content", (plan.Commands[1] as PredictedSayCommand)?.Response.Context?.Citations[0].Content);
            Assert.Equal("title", (plan.Commands[1] as PredictedSayCommand)?.Response.Context?.Citations[0].Title);
            Assert.Equal("url", (plan.Commands[1] as PredictedSayCommand)?.Response.Context?.Citations[0].Url);
        }

        [Fact]
        public async Task Test_CreatePlanFromResponseAsync_EmptyResponse_ReturnsNull()
        {
            // Arrange
            Mock<ITurnContext> context = new();
            MemoryFork memory = new();
            SequenceAugmentation augmentation = new(new());
            PromptResponse promptResponse = new()
            {
                Status = PromptResponseStatus.Success
            };

            // Act
            var plan = await augmentation.CreatePlanFromResponseAsync(context.Object, memory, promptResponse);

            // Assert
            Assert.Null(plan);
        }

        [Fact]
        public async Task Test_CreatePlanFromResponseAsync_InvalidContent_ReturnsNull()
        {
            // Arrange
            Mock<ITurnContext> context = new();
            MemoryFork memory = new();
            SequenceAugmentation augmentation = new(new());
            PromptResponse promptResponse = new()
            {
                Status = PromptResponseStatus.Success,
                Message = new(ChatRole.Assistant)
                {
                    Content = @"{ ""type"": ""invalid"" }"
                }
            };

            // Act
            var plan = await augmentation.CreatePlanFromResponseAsync(context.Object, memory, promptResponse);

            // Assert
            Assert.Null(plan);
        }

        [Fact]
        public async Task Test_ValidateResponseAsync_ShouldSucceed()
        {
            // Arrange
            Mock<ITurnContext> context = new();
            MemoryFork memory = new();
            GPTTokenizer tokenizer = new();
            SequenceAugmentation augmentation = new(new()
            {
                new("test")
                {
                    Description = "test action",
                    Parameters = new JsonSchemaBuilder()
                        .Type(SchemaValueType.Object)
                        .Properties(
                            (
                                "foo",
                                new JsonSchemaBuilder()
                                    .Type(SchemaValueType.String)
                            )
                        )
                        .Required(new string[] { "foo" })
                        .Build()
                }
            });
            PromptResponse promptResponse = new()
            {
                Status = PromptResponseStatus.Success,
                Message = new(ChatRole.Assistant)
                {
                    Content = @"{
  ""type"": ""plan"",
  ""commands"": [
    {
      ""type"": ""DO"",
      ""action"": ""test"",
      ""parameters"": {
        ""foo"": ""bar""
      }
    },
    {
      ""type"": ""SAY"",
      ""response"": ""hello""
    }
  ]
}"
                }
            };

            // Act
            var res = await augmentation.ValidateResponseAsync(context.Object, memory, tokenizer, promptResponse, 0);

            // Assert
            Assert.True(res.Valid);
        }

        [Fact]
        public async Task Test_ValidateResponseAsync_InvalidJson_ShouldFail()
        {
            // Arrange
            Mock<ITurnContext> context = new();
            MemoryFork memory = new();
            GPTTokenizer tokenizer = new();
            SequenceAugmentation augmentation = new(new());
            PromptResponse promptResponse = new()
            {
                Status = PromptResponseStatus.Success,
                Message = new(ChatRole.Assistant)
                {
                    Content = @"{invalid-json,)}"
                }
            };

            // Act
            var res = await augmentation.ValidateResponseAsync(context.Object, memory, tokenizer, promptResponse, 0);

            // Assert
            Assert.False(res.Valid);
            Assert.Equal("Return a JSON object that uses the SAY command to say what you're thinking.", res.Feedback);
            Assert.Null(res.Value);
        }

        [Fact]
        public async Task Test_ValidateResponseAsync_InvalidAction_ShouldFail()
        {
            // Arrange
            Mock<ITurnContext> context = new();
            MemoryFork memory = new();
            GPTTokenizer tokenizer = new();
            SequenceAugmentation augmentation = new(new());
            PromptResponse promptResponse = new()
            {
                Status = PromptResponseStatus.Success,
                Message = new(ChatRole.Assistant)
                {
                    Content = @"{
  ""type"": ""plan"",
  ""commands"": [
    {
      ""type"": ""DO"",
      ""action"": ""test""
    }
  ]
}"
                }
            };

            // Act
            var res = await augmentation.ValidateResponseAsync(context.Object, memory, tokenizer, promptResponse, 0);

            // Assert
            Assert.False(res.Valid);
            Assert.True(res.Feedback?.StartsWith("Unknown action"));
            Assert.Null(res.Value);
        }
    }
}
