using Microsoft.Teams.AI.AI.Models;
using Microsoft.Bot.Builder;
using Microsoft.Teams.AI.AI.Prompts;
using Microsoft.Teams.AI.AI.Prompts.Sections;
using Microsoft.Teams.AI.AI.Tokenizers;
using Moq;
using Microsoft.Teams.AI.State;

namespace Microsoft.Teams.AI.Tests.AITests.PromptsTests.SectionsTests
{
    internal sealed class TestSection : PromptSection
    {
        public TestSection(int tokens = -1, bool required = false, string separator = "\n", string prefix = "") : base(tokens, required, separator, prefix)
        {
        }

        /// <inheritdoc />
        public override async Task<RenderedPromptSection<List<ChatMessage>>> RenderAsMessagesAsync(ITurnContext context, IMemory memory, IPromptFunctions<List<string>> functions, ITokenizer tokenizer, int maxTokens, CancellationToken cancellationToken = default)
        {
            List<ChatMessage> messages = new()
            {new(ChatRole.System) { Content = "Hello World!" }};

            return await Task.FromResult(this.TruncateMessages(messages, tokenizer, maxTokens));
        }

        public string GetMessage(ChatMessage message)
        {
            return this.GetMessageText(message);
        }
    }

    public class PromptSectionTests
    {
        [Fact]
        public async void Test_RenderAsTextAsync_ShouldRender()
        {
            TestSection section = new();
            Mock<ITurnContext> context = new();
            MemoryFork memory = new();
            GPTTokenizer tokenizer = new();
            PromptManager manager = new();
            RenderedPromptSection<string> rendered = await section.RenderAsTextAsync(context.Object, memory, manager, tokenizer, 10);

            Assert.Equal("Hello World!", rendered.Output);
            Assert.Equal(3, rendered.Length);
        }

        [Fact]
        public async void Test_RenderAsTextAsync_ShouldTruncate()
        {
            TestSection section = new(8);
            Mock<ITurnContext> context = new();
            MemoryFork memory = new();
            GPTTokenizer tokenizer = new();
            PromptManager manager = new();
            RenderedPromptSection<string> rendered = await section.RenderAsTextAsync(context.Object, memory, manager, tokenizer, 2);

            Assert.Equal("Hello World", rendered.Output);
            Assert.Equal(2, rendered.Length);
        }

        [Fact]
        public void Test_GetMessage()
        {
            ChatMessage message = new(ChatRole.User)
            {
                Content = new List<MessageContentParts>()
                {
                    new TextContentPart()
                    {
                        Text = "Hello",
                    },

                    new TextContentPart()
                    {
                        Text = "World"
                    }
                }
            };

            string msg = new TestSection().GetMessage(message);

            Assert.Equal("Hello World", msg);
        }
    }
}
