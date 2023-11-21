using Microsoft.Bot.Builder;
using Microsoft.Teams.AI.AI.Prompts;
using Microsoft.Teams.AI.AI.Tokenizers;
using Microsoft.Teams.AI.AI.Validators;
using Microsoft.Teams.AI.State;
using Moq;

namespace Microsoft.Teams.AI.Tests.AITests.ValidatorsTests
{
    public class DefaultResponseValidatorTests
    {
        [Fact]
        public async void Test_ShouldSucceed()
        {
            Mock<ITurnContext> context = new();
            MemoryFork memory = new();
            GPTTokenizer tokenizer = new();
            DefaultResponseValidator validator = new();
            PromptResponse promptResponse = new();

            var res = await validator.ValidateResponseAsync(context.Object, memory, tokenizer, promptResponse, 0);

            Assert.True(res.Valid);
        }
    }
}
