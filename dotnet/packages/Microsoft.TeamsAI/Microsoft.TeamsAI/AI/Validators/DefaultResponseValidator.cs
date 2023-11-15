using Microsoft.Bot.Builder;
using Microsoft.Teams.AI.AI.Prompts;
using Microsoft.Teams.AI.AI.Tokenizers;
using Microsoft.Teams.AI.Memory;

namespace Microsoft.Teams.AI.AI.Validators
{
    /// <summary>
    /// Default response validator that always returns true.
    /// </summary>
    public class DefaultResponseValidator<TValue> : IPromptResponseValidator<TValue>
    {
        /// <summary>
        /// Creates instance of `DefaultResponseValidator`
        /// </summary>
        public DefaultResponseValidator() : base() { }

        /// <inheritdoc />
        public async Task<Validation<TValue>> ValidateResponseAsync(ITurnContext context, IMemory memory, ITokenizer tokenizer, PromptResponse response, int remainingAttempts)
        {
            return await Task.FromResult(new Validation<TValue>()
            {
                Valid = true
            });
        }
    }
}
