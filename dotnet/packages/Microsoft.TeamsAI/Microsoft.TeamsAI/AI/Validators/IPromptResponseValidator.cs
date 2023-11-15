using Microsoft.Bot.Builder;
using Microsoft.Teams.AI.AI.Prompts;
using Microsoft.Teams.AI.AI.Tokenizers;
using Microsoft.Teams.AI.Memory;

namespace Microsoft.Teams.AI.AI.Validators
{
    /// <summary>
    /// A validator that can be used to validate prompt responses.
    /// </summary>
    public interface IPromptResponseValidator<TValue>
    {
        /// <summary>
        /// Validates a response to a prompt.
        /// </summary>
        /// <param name="context">Context for the current turn of conversation with the user.</param>
        /// <param name="memory">An interface for accessing state values.</param>
        /// <param name="tokenizer">Tokenizer to use for encoding and decoding text.</param>
        /// <param name="response">Response to validate.</param>
        /// <param name="remainingAttempts">Number of remaining attempts to validate the response.</param>
        /// <returns></returns>
        public Task<Validation<TValue>> ValidateResponseAsync(ITurnContext context, IMemory memory, ITokenizer tokenizer, PromptResponse response, int remainingAttempts);
    }
}
