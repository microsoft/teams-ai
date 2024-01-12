using Microsoft.Bot.Builder;
using Microsoft.Teams.AI.AI.Prompts;
using Microsoft.Teams.AI.AI.Tokenizers;
using Microsoft.Teams.AI.State;

namespace Microsoft.Teams.AI.AI.Validators
{
    /// <summary>
    /// A validator that can be used to validate prompt responses.
    /// </summary>
    public interface IPromptResponseValidator
    {
        /// <summary>
        /// Validates a response to a prompt.
        /// </summary>
        /// <param name="context">Context for the current turn of conversation with the user.</param>
        /// <param name="memory">An interface for accessing state values.</param>
        /// <param name="tokenizer">Tokenizer to use for encoding and decoding text.</param>
        /// <param name="response">Response to validate.</param>
        /// <param name="remainingAttempts">Number of remaining attempts to validate the response.</param>
        /// <param name="cancellationToken">A cancellation token that can be used by other objects
        /// or threads to receive notice of cancellation.</param>
        /// <returns></returns>
        public Task<Validation> ValidateResponseAsync(ITurnContext context, IMemory memory, ITokenizer tokenizer, PromptResponse response, int remainingAttempts, CancellationToken cancellationToken = default);
    }
}
