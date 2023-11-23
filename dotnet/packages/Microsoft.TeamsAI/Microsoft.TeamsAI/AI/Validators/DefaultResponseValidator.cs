using Microsoft.Bot.Builder;
using Microsoft.Teams.AI.AI.Prompts;
using Microsoft.Teams.AI.AI.Tokenizers;
using Microsoft.Teams.AI.State;

namespace Microsoft.Teams.AI.AI.Validators
{
    /// <summary>
    /// Default response validator that always returns true.
    /// </summary>
    public class DefaultResponseValidator : IPromptResponseValidator
    {
        /// <summary>
        /// Creates instance of `DefaultResponseValidator`
        /// </summary>
        public DefaultResponseValidator() : base() { }

        /// <inheritdoc />
        public async Task<Validation> ValidateResponseAsync(ITurnContext context, IMemory memory, ITokenizer tokenizer, PromptResponse response, int remainingAttempts, CancellationToken cancellationToken = default)
        {
            return await Task.FromResult(new Validation()
            {
                Valid = true
            });
        }
    }
}
