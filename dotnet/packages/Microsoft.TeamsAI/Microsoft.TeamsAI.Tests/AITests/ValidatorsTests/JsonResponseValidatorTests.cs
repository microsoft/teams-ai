using Json.Schema;
using Microsoft.Bot.Builder;
using Microsoft.Teams.AI.AI.Models;
using Microsoft.Teams.AI.AI.Prompts;
using Microsoft.Teams.AI.AI.Tokenizers;
using Microsoft.Teams.AI.AI.Validators;
using Microsoft.Teams.AI.State;
using Moq;

namespace Microsoft.Teams.AI.Tests.AITests.ValidatorsTests
{
    public class JsonResponseValidatorTests
    {
        [Fact]
        public async void Test_NoSchema_ShouldSucceed()
        {
            Mock<ITurnContext> context = new();
            MemoryFork memory = new();
            GPTTokenizer tokenizer = new();
            JsonResponseValidator validator = new();
            PromptResponse promptResponse = new()
            {
                Status = PromptResponseStatus.Success,
                Message = new(ChatRole.Assistant) { Content = "{\"foo\":\"bar\"}" }
            };

            var res = await validator.ValidateResponseAsync(context.Object, memory, tokenizer, promptResponse, 0);

            Assert.True(res.Valid);
        }

        [Fact]
        public async void Test_WithSchema_ShouldSucceed()
        {
            JsonSchemaBuilder schema = new JsonSchemaBuilder()
                .Type(SchemaValueType.Object)
                .Properties(
                    (
                        "foo",
                        new JsonSchemaBuilder().Type(SchemaValueType.String)
                    )
                )
                .Required(new string[] { "foo" });

            Mock<ITurnContext> context = new();
            MemoryFork memory = new();
            GPTTokenizer tokenizer = new();
            JsonResponseValidator validator = new(schema.Build());
            PromptResponse promptResponse = new()
            {
                Status = PromptResponseStatus.Success,
                Message = new(ChatRole.Assistant) { Content = "{\"foo\":\"bar\"}" }
            };

            var res = await validator.ValidateResponseAsync(context.Object, memory, tokenizer, promptResponse, 0);

            Assert.True(res.Valid);
        }

        [Fact]
        public async void Test_WithSchema_ShouldFailRequired()
        {
            JsonSchemaBuilder schema = new JsonSchemaBuilder()
                .Type(SchemaValueType.Object)
                .Properties(
                    (
                        "foo",
                        new JsonSchemaBuilder().Type(SchemaValueType.String)
                    )
                )
                .Required(new string[] { "foo" });

            Mock<ITurnContext> context = new();
            MemoryFork memory = new();
            GPTTokenizer tokenizer = new();
            JsonResponseValidator validator = new(schema.Build());
            PromptResponse promptResponse = new()
            {
                Status = PromptResponseStatus.Success,
                Message = new(ChatRole.Assistant) { Content = "{\"hello\":1}" }
            };

            var res = await validator.ValidateResponseAsync(context.Object, memory, tokenizer, promptResponse, 0);

            Assert.False(res.Valid);
        }

        [Fact]
        public async void Test_WithSchema_ShouldFailType()
        {
            JsonSchemaBuilder schema = new JsonSchemaBuilder()
                .Type(SchemaValueType.Object)
                .Properties(
                    (
                        "foo",
                        new JsonSchemaBuilder().Type(SchemaValueType.String)
                    )
                )
                .Required(new string[] { "foo" });

            Mock<ITurnContext> context = new();
            MemoryFork memory = new();
            GPTTokenizer tokenizer = new();
            JsonResponseValidator validator = new(schema.Build());
            PromptResponse promptResponse = new()
            {
                Status = PromptResponseStatus.Success,
                Message = new(ChatRole.Assistant) { Content = "{\"foo\":1}" }
            };

            var res = await validator.ValidateResponseAsync(context.Object, memory, tokenizer, promptResponse, 0);

            Assert.False(res.Valid);
        }
    }
}
