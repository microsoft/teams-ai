using Microsoft.Bot.Builder;
using Microsoft.Teams.AI.AI.Prompts.Sections;
using Microsoft.Teams.AI.AI.Tokenizers;
using Moq;

namespace Microsoft.Teams.AI.Tests.AITests.PromptsTests.SectionsTests
{
    public class FunctionCallMessageSectionTests
    {
        [Fact]
        public async void Test_RenderAsTextAsync_ShouldRender()
        {
            FunctionCallMessageSection section = new(new("MyFunction", ""));
            Mock<ITurnContext> context = new();
            Memory.Memory memory = new();
            GPTTokenizer tokenizer = new();
            TestFunctions functions = new();

            RenderedPromptSection<string> rendered = await section.RenderAsTextAsync(context.Object, memory, functions, tokenizer, 20);
            Assert.Equal("assistant: {\"Name\":\"MyFunction\",\"Arguments\":\"\"}", rendered.Output);
            Assert.Equal(12, rendered.Length);
        }
    }
}
