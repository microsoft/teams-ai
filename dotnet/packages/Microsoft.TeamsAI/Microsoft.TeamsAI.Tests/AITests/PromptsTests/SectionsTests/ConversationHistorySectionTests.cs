using Microsoft.Teams.AI.AI.Models;
using Microsoft.Bot.Builder;
using Microsoft.Teams.AI.AI.Prompts;
using Microsoft.Teams.AI.AI.Prompts.Sections;
using Microsoft.Teams.AI.AI.Tokenizers;
using Moq;

namespace Microsoft.Teams.AI.Tests.AITests.PromptsTests.SectionsTests
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
            PromptManager manager = new();

            memory.SetValue("history", new List<ChatMessage>()
            {
                new(ChatRole.System) { Content = "you are a unit test bot" },
                new(ChatRole.User) { Content = "hi" },
                new(ChatRole.Assistant) { Content = "hi, how may I assist you?" }
            });

            RenderedPromptSection<string> rendered = await section.RenderAsTextAsync(context.Object, memory, manager, tokenizer, 50);
            Assert.Equal("assistant: hi, how may I assist you?\nuser: hi\nyou are a unit test bot", rendered.Output);
            Assert.Equal(21, rendered.Length);
        }

        [Fact]
        public async void Test_RenderAsTextAsync_ShouldRenderEmpty()
        {
            ConversationHistorySection section = new("history");
            Mock<ITurnContext> context = new();
            Memory.Memory memory = new();
            GPTTokenizer tokenizer = new();
            PromptManager manager = new();

            RenderedPromptSection<string> rendered = await section.RenderAsTextAsync(context.Object, memory, manager, tokenizer, 50);
            Assert.Equal("", rendered.Output);
            Assert.Equal(0, rendered.Length);
        }
    }
}
