using Azure.AI.OpenAI;
using Microsoft.Bot.Builder;
using Microsoft.Teams.AI.AI.Prompts;
using Microsoft.Teams.AI.AI.Tokenizers;
using Moq;

namespace Microsoft.Teams.AI.Tests.AITests.PromptsTests
{
    public class GroupSectionTests
    {
        [Fact]
        public async void Test_RenderAsTextAsync_ShouldRender()
        {
            GroupSection section = new(ChatRole.User, new()
            {
                new TextSection("Hello World", ChatRole.User),
                new GroupSection(ChatRole.Assistant, new()
                {
                    new TextSection("how can I help you?", ChatRole.Assistant)
                })
            });

            Mock<ITurnContext> context = new();
            Memory.Memory memory = new();
            GPTTokenizer tokenizer = new();
            TestFunctions functions = new();
            RenderedPromptSection<string> rendered = await section.RenderAsTextAsync(context.Object, memory, functions, tokenizer, 10);

            Assert.Equal("Hello World\nhow can I help you?", rendered.output);
            Assert.Equal(9, rendered.length);
        }

        [Fact]
        public async void Test_RenderAsTextAsync_ShouldTruncate()
        {
            GroupSection section = new(ChatRole.User, new()
            {
                new TextSection("Hello World", ChatRole.User, -1, true),
                new GroupSection(ChatRole.Assistant, new()
                {
                    new TextSection("how can I help you?", ChatRole.Assistant, -1, true)
                }, -1, true)
            }, -1, true);

            Mock<ITurnContext> context = new();
            Memory.Memory memory = new();
            GPTTokenizer tokenizer = new();
            TestFunctions functions = new();
            RenderedPromptSection<string> rendered = await section.RenderAsTextAsync(context.Object, memory, functions, tokenizer, 4);

            Assert.Equal("Hello World\nhow", rendered.output);
            Assert.Equal(4, rendered.length);
        }
    }
}
