using Azure.AI.OpenAI;
using Microsoft.Bot.Builder;
using Microsoft.Teams.AI.AI.Prompts;
using Microsoft.Teams.AI.AI.Tokenizers;
using Moq;

namespace Microsoft.Teams.AI.Tests.AITests.PromptsTests
{
    public class TemplateSectionTests
    {
        [Fact]
        public async void Test_RenderAsTextAsync_ShouldRenderWithFunction()
        {
            TemplateSection section = new("this is a test message: {{getMessage}}", ChatRole.User);
            Mock<ITurnContext> context = new();
            Memory.Memory memory = new();
            GPTTokenizer tokenizer = new();
            TestFunctions functions = new();

            functions.AddFunction("getMessage", async (context, memory, functions, tokenizer, args) =>
            {
                return await Task.FromResult("Hello World!");
            });

            RenderedPromptSection<string> rendered = await section.RenderAsTextAsync(context.Object, memory, functions, tokenizer, 10);

            Assert.Equal("this is a test message: Hello World!", rendered.output);
            Assert.Equal(9, rendered.length);
        }

        [Fact]
        public async void Test_RenderAsTextAsync_ShouldRenderWithFunctionArgs()
        {
            TemplateSection section = new("this is a test message: {{getMessage 'my param'}}", ChatRole.User);
            Mock<ITurnContext> context = new();
            Memory.Memory memory = new();
            GPTTokenizer tokenizer = new();
            TestFunctions functions = new();

            functions.AddFunction("getMessage", async (context, memory, functions, tokenizer, args) =>
            {
                return await Task.FromResult($"your param is: {args.First()}");
            });

            RenderedPromptSection<string> rendered = await section.RenderAsTextAsync(context.Object, memory, functions, tokenizer, 15);

            Assert.Equal("this is a test message: your param is: my param", rendered.output);
            Assert.Equal(12, rendered.length);
        }

        [Fact]
        public async void Test_RenderAsTextAsync_ShouldRenderWithVariable()
        {
            TemplateSection section = new("this is a test message: {{$message}}", ChatRole.User);
            Mock<ITurnContext> context = new();
            Memory.Memory memory = new();
            GPTTokenizer tokenizer = new();
            TestFunctions functions = new();

            memory.SetValue("message", "Hello World!");

            RenderedPromptSection<string> rendered = await section.RenderAsTextAsync(context.Object, memory, functions, tokenizer, 15);

            Assert.Equal("this is a test message: Hello World!", rendered.output);
            Assert.Equal(9, rendered.length);
        }
    }
}
