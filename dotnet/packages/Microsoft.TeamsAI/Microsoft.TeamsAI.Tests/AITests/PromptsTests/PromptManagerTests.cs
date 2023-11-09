using Microsoft.Bot.Builder;
using Microsoft.Teams.AI.AI.Prompts;
using Microsoft.Teams.AI.AI.Tokenizers;
using Moq;

namespace Microsoft.Teams.AI.Tests.AITests.PromptsTests
{
    public class PromptManagerTests
    {
        [Fact]
        public async void Test_Functions()
        {
            PromptManager manager = new();
            Mock<ITurnContext> context = new();
            Memory.Memory memory = new();
            GPTTokenizer tokenizer = new();

            manager.AddFunction("getMessage", async (context, memory, functions, tokenizer, args) =>
            {
                return await Task.FromResult("Hello World!");
            });

            dynamic? result = await manager.InvokeFunctionAsync("getMessage", context.Object, memory, tokenizer, new() { });

            Assert.True(manager.HasFunction("getMessage"));
            Assert.NotNull(manager.GetFunction("getMessage"));
            Assert.Equal("Hello World!", result);
        }

        [Fact]
        public void Test_Prompts()
        {
            PromptManager manager = new();

            manager.AddPrompt("MyPrompt", new("MyPrompt", new(new() { }), new()));

            Assert.True(manager.HasPrompt("MyPrompt"));
            Assert.Equal("MyPrompt", manager.GetPrompt("MyPrompt").Name);
        }
    }
}
