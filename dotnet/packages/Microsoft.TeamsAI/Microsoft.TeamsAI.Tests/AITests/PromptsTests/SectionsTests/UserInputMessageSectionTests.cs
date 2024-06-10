using Microsoft.Bot.Builder;
using Microsoft.Teams.AI.AI.Models;
using Microsoft.Teams.AI.AI.Prompts.Sections;
using Microsoft.Teams.AI.AI.Prompts;
using Microsoft.Teams.AI.AI.Tokenizers;
using Microsoft.Teams.AI.State;
using Moq;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Microsoft.Teams.AI.Application;
using static System.Net.Mime.MediaTypeNames;

namespace Microsoft.Teams.AI.Tests.AITests.PromptsTests.SectionsTests
{
    public class UserInputMessageSectionTest
    {
        [Fact]
        public async void Test_RenderAsMessagesAsync_ShoulderRender()
        {
            // Arrange
            UserInputMessageSection section = new();
            Mock<ITurnContext> context = new();
            MemoryFork memory = new();
            GPTTokenizer tokenizer = new();
            PromptManager manager = new();

            // Act
            memory.SetValue("input", "hi");

            memory.SetValue("inputFiles", new List<InputFile>()
            {
                new(BinaryData.FromString("testData"), "image/png")
            });

            // Assert
            RenderedPromptSection<List<ChatMessage>> rendered = await section.RenderAsMessagesAsync(context.Object, memory, manager, tokenizer, 200);
            var messageContentParts = rendered.Output[0].GetContent<List<MessageContentParts>>();

            Assert.Equal("hi", ((TextContentPart)messageContentParts[0]).Text);

            // the base64 string is an encoding of "hi"
            var imageUrl = $"data:image/png;base64,dGVzdERhdGE=";
            Assert.Equal(imageUrl, ((ImageContentPart)messageContentParts[1]).ImageUrl);

            Assert.Equal(86, rendered.Length);
        }
    }
}
