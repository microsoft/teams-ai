using Json.Schema;
using Microsoft.Bot.Builder;
using Microsoft.Teams.AI.AI.Models;
using Microsoft.Teams.AI.AI.Prompts;
using Microsoft.Teams.AI.AI.Tokenizers;
using Microsoft.Teams.AI.AI.Validators;
using Moq;

namespace Microsoft.Teams.AI.Tests.AITests.ValidatorsTests
{
    public class ActionResponseValidatorTests
    {
        [Fact]
        public async void Test_FunctionWithParams_ShouldSucceed()
        {
            Mock<ITurnContext> context = new();
            Memory.Memory memory = new();
            GPTTokenizer tokenizer = new();
            ActionResponseValidator validator = new(new()
            {
                new("test", "test action")
                {
                    Parameters = new JsonSchemaBuilder()
                        .Type(SchemaValueType.Object)
                        .Properties(
                            (
                                "foo",
                                new JsonSchemaBuilder().Type(SchemaValueType.String)
                            )
                        )
                        .Required(new string[] { "foo" })
                }
            });

            PromptResponse promptResponse = new()
            {
                Status = PromptResponseStatus.Success,
                Message = new(ChatRole.Assistant, "")
                {
                    FunctionCall = new("test", "{ \"foo\": \"bar\" }")
                }
            };

            var res = await validator.ValidateResponseAsync(context.Object, memory, tokenizer, promptResponse, 0);

            Assert.True(res.Valid);
        }

        [Fact]
        public async void Test_FunctionWithMissingParams_ShouldFail()
        {
            Mock<ITurnContext> context = new();
            Memory.Memory memory = new();
            GPTTokenizer tokenizer = new();
            ActionResponseValidator validator = new(new()
            {
                new("test", "test action")
                {
                    Parameters = new JsonSchemaBuilder()
                        .Type(SchemaValueType.Object)
                        .Properties(
                            (
                                "foo",
                                new JsonSchemaBuilder().Type(SchemaValueType.String)
                            )
                        )
                        .Required(new string[] { "foo" })
                }
            });

            PromptResponse promptResponse = new()
            {
                Status = PromptResponseStatus.Success,
                Message = new(ChatRole.Assistant, "")
                {
                    FunctionCall = new("test", "{ \"hello\": \"world\" }")
                }
            };

            var res = await validator.ValidateResponseAsync(context.Object, memory, tokenizer, promptResponse, 0);

            Assert.False(res.Valid);
        }

        [Fact]
        public async void Test_FunctionWithInvalidParams_ShouldFail()
        {
            Mock<ITurnContext> context = new();
            Memory.Memory memory = new();
            GPTTokenizer tokenizer = new();
            ActionResponseValidator validator = new(new()
            {
                new("test", "test action")
                {
                    Parameters = new JsonSchemaBuilder()
                        .Type(SchemaValueType.Object)
                        .Properties(
                            (
                                "foo",
                                new JsonSchemaBuilder().Type(SchemaValueType.String)
                            )
                        )
                        .Required(new string[] { "foo" })
                }
            });

            PromptResponse promptResponse = new()
            {
                Status = PromptResponseStatus.Success,
                Message = new(ChatRole.Assistant, "")
                {
                    FunctionCall = new("test", "{ \"foo\": 1 }")
                }
            };

            var res = await validator.ValidateResponseAsync(context.Object, memory, tokenizer, promptResponse, 0);

            Assert.False(res.Valid);
        }

        [Fact]
        public async void Test_MissingAction_ShouldFail()
        {
            Mock<ITurnContext> context = new();
            Memory.Memory memory = new();
            GPTTokenizer tokenizer = new();
            ActionResponseValidator validator = new(new()
            {
                new("test", "test action")
                {
                    Parameters = new JsonSchemaBuilder()
                        .Type(SchemaValueType.Object)
                        .Properties(
                            (
                                "foo",
                                new JsonSchemaBuilder().Type(SchemaValueType.String)
                            )
                        )
                        .Required(new string[] { "foo" })
                }
            });

            PromptResponse promptResponse = new()
            {
                Status = PromptResponseStatus.Success,
                Message = new(ChatRole.Assistant, "")
                {
                    FunctionCall = new("empty", "{ \"foo\": \"bar\" }")
                }
            };

            var res = await validator.ValidateResponseAsync(context.Object, memory, tokenizer, promptResponse, 0);

            Assert.False(res.Valid);
        }

        [Fact]
        public async void Test_TextMessageRequired_ShouldFail()
        {
            Mock<ITurnContext> context = new();
            Memory.Memory memory = new();
            GPTTokenizer tokenizer = new();
            ActionResponseValidator validator = new(new()
            {
                new("test", "test action")
                {
                    Parameters = new JsonSchemaBuilder()
                        .Type(SchemaValueType.Object)
                        .Properties(
                            (
                                "foo",
                                new JsonSchemaBuilder().Type(SchemaValueType.String)
                            )
                        )
                        .Required(new string[] { "foo" })
                }
            }, true);

            PromptResponse promptResponse = new()
            {
                Status = PromptResponseStatus.Success,
                Message = new(ChatRole.Assistant, "test")
            };

            var res = await validator.ValidateResponseAsync(context.Object, memory, tokenizer, promptResponse, 0);

            Assert.False(res.Valid);
        }
    }
}
