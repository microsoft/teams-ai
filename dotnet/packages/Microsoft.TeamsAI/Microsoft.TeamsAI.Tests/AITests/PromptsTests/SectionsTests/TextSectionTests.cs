using Azure.AI.OpenAI;
using Microsoft.Bot.Builder;
using Microsoft.Teams.AI.AI.Prompts.Sections;
using Microsoft.Teams.AI.AI.Tokenizers;
using Moq;

namespace Microsoft.Teams.AI.Tests.AITests.PromptsTests.SectionsTests
{
    public class TextSectionTests
    {
        [Fact]
        public async void Test_RenderAsTextAsync_ShouldRender()
        {
            TextSection section = new("this is a test section", ChatRole.User);
            Mock<ITurnContext> context = new();
            Memory.Memory memory = new();
            GPTTokenizer tokenizer = new();
            TestFunctions functions = new();
            RenderedPromptSection<string> rendered = await section.RenderAsTextAsync(context.Object, memory, functions, tokenizer, 10);

            Assert.Equal("this is a test section", rendered.output);
            Assert.Equal(5, rendered.length);
        }

        [Fact]
        public async void Test_RenderAsTextAsync_ShouldTruncate()
        {
            TextSection section = new("this is a test section", ChatRole.User);
            Mock<ITurnContext> context = new();
            Memory.Memory memory = new();
            GPTTokenizer tokenizer = new();
            TestFunctions functions = new();
            RenderedPromptSection<string> rendered = await section.RenderAsTextAsync(context.Object, memory, functions, tokenizer, 3);

            Assert.Equal("this is a", rendered.output);
            Assert.Equal(3, rendered.length);
        }
    }
}
