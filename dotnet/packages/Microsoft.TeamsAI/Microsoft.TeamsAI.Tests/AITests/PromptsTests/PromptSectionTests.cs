using Azure.AI.OpenAI;
using Microsoft.Bot.Builder;
using Microsoft.Teams.AI.AI.Prompts;
using Microsoft.Teams.AI.AI.Tokenizers;
using Moq;

namespace Microsoft.Teams.AI.Tests.AITests.PromptsTests
{
    internal sealed class TestSection : PromptSection
    {
        public TestSection(int tokens = -1, bool required = false, string separator = "\n", string prefix = "") : base(tokens, required, separator, prefix)
        {
        }

        /// <inheritdoc />
        public override async Task<RenderedPromptSection<List<ChatMessage>>> RenderAsMessagesAsync(ITurnContext context, Memory.Memory memory, IPromptFunctions<List<string>> functions, ITokenizer tokenizer, int maxTokens)
        {
            List<ChatMessage> messages = new()
            {new(ChatRole.System, "Hello World!")};

            return await Task.FromResult(this.TruncateMessages(messages, tokenizer, maxTokens));
        }
    }

    internal sealed class TestFunctions : IPromptFunctions<List<string>>
    {
        private Dictionary<string, PromptFunction<List<string>>> _functions = new();

        public bool HasFunction(string name)
        {
            return this._functions.ContainsKey(name);
        }

        public PromptFunction<List<string>>? GetFunction(string name)
        {
            return this._functions[name];
        }

        public void AddFunction(string name, PromptFunction<List<string>> func)
        {
            this._functions[name] = func;
        }

        public async Task<dynamic?> InvokeFunctionAsync(string name, ITurnContext context, Memory.Memory memory, ITokenizer tokenizer, List<string> args)
        {
            PromptFunction<List<string>>? func = this.GetFunction(name);

            if (func != null)
            {
                return await func(context, memory, this, tokenizer, args);
            }

            return null;
        }
    }

    public class PromptSectionTests
    {
        [Fact]
        public async void Test_RenderAsTextAsync_ShouldRender()
        {
            TestSection section = new();
            Mock<ITurnContext> context = new();
            Memory.Memory memory = new();
            GPTTokenizer tokenizer = new();
            TestFunctions functions = new();
            RenderedPromptSection<string> rendered = await section.RenderAsTextAsync(context.Object, memory, functions, tokenizer, 10);

            Assert.Equal("Hello World!", rendered.output);
            Assert.Equal(3, rendered.length);
        }

        [Fact]
        public async void Test_RenderAsTextAsync_ShouldTruncate()
        {
            TestSection section = new(8);
            Mock<ITurnContext> context = new();
            Memory.Memory memory = new();
            GPTTokenizer tokenizer = new();
            TestFunctions functions = new();
            RenderedPromptSection<string> rendered = await section.RenderAsTextAsync(context.Object, memory, functions, tokenizer, 2);

            Assert.Equal("Hello World", rendered.output);
            Assert.Equal(2, rendered.length);
        }
    }
}
