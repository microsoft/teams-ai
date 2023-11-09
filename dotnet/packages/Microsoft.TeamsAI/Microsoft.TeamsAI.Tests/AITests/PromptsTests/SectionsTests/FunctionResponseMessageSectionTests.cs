using Microsoft.Bot.Builder;
using Microsoft.Teams.AI.AI.Prompts.Sections;
using Microsoft.Teams.AI.AI.Tokenizers;
using Moq;

namespace Microsoft.Teams.AI.Tests.AITests.PromptsTests.SectionsTests
{
    public class FunctionResponseMessageSectionTests
    {
        [Fact]
        public async void Test_RenderAsTextAsync_ShouldRender()
        {
            FunctionResponseMessageSection section = new("MyFunction", 27);
            Mock<ITurnContext> context = new();
            Memory.Memory memory = new();
            GPTTokenizer tokenizer = new();
            TestFunctions functions = new();

            RenderedPromptSection<string> rendered = await section.RenderAsTextAsync(context.Object, memory, functions, tokenizer, 10);
            Assert.Equal("user: MyFunction returned 27", rendered.Output);
            Assert.Equal(8, rendered.Length);
        }
    }
}
