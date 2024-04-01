using Microsoft.Teams.AI.AI.Tokenizers;

namespace Microsoft.Teams.AI.Tests.UtilitiesTests
{
    public class TokenizerTests
    {
        public static IEnumerable<object[]> TokenizersObjects()
        {
            yield return new object[] { new GPTTokenizer() };
            yield return new object[] { new GPTTokenizer("gpt-4") };
        }


        [Theory]
        [MemberData(nameof(TokenizersObjects))]
        public void ValidateResults(ITokenizer tokenizer)
        {
            string text = "Hello, World";
            Assert.NotNull(tokenizer);
            List<int> tokens = tokenizer.Encode(text);

            Assert.Equal(new int[] { 9906, 11, 4435 }, tokens);
            Assert.Equal(text, tokenizer.Decode(tokens));
        }
    }
}
