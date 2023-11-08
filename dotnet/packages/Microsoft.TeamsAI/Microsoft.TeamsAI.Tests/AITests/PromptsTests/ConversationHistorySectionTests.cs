using Azure.AI.OpenAI;
using Microsoft.Bot.Builder;
using Microsoft.Teams.AI.AI.Prompts;
using Microsoft.Teams.AI.AI.Tokenizers;
using Moq;

namespace Microsoft.Teams.AI.Tests.AITests.PromptsTests
{
    public class ConversationHistorySectionTests
    {
        [Fact]
        public async void Test_RenderAsTextAsync_ShouldRender()
        {
            ConversationHistorySection section = new("history");
            Mock<ITurnContext> context = new();
            Memory.Memory memory = new();
            GPTTokenizer tokenizer = new();
            TestFunctions functions = new();

            memory.SetValue("history", new List<ChatMessage>()
            {
                new(ChatRole.System, "you are a unit test bot"),
                new(ChatRole.User, "hi"),
                new(ChatRole.Assistant, "hi, how may I assist you?")
            });

            RenderedPromptSection<string> rendered = await section.RenderAsTextAsync(context.Object, memory, functions, tokenizer, 50);
            Assert.Equal("assistant: hi, how may I assist you?\nuser: hi\nyou are a unit test bot", rendered.output);
            Assert.Equal(21, rendered.length);
        }

        [Fact]
        public async void Test_RenderAsTextAsync_ShouldRenderEmpty()
        {
            ConversationHistorySection section = new("history");
            Mock<ITurnContext> context = new();
            Memory.Memory memory = new();
            GPTTokenizer tokenizer = new();
            TestFunctions functions = new();

            RenderedPromptSection<string> rendered = await section.RenderAsTextAsync(context.Object, memory, functions, tokenizer, 50);
            Assert.Equal("", rendered.output);
            Assert.Equal(0, rendered.length);
        }
    }
}
