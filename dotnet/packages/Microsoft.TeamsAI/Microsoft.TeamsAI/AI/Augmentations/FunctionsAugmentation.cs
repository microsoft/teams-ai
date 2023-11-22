using Microsoft.Bot.Builder;
using Microsoft.Teams.AI.AI.Planners;
using Microsoft.Teams.AI.AI.Prompts;
using Microsoft.Teams.AI.AI.Prompts.Sections;
using Microsoft.Teams.AI.AI.Tokenizers;
using Microsoft.Teams.AI.AI.Validators;
using Microsoft.Teams.AI.State;

namespace Microsoft.Teams.AI.AI.Augmentations
{
    /// <summary>
    /// Functions Augmentation
    /// </summary>
    public class FunctionsAugmentation : IAugmentation
    {
        /// <summary>
        /// Creates an instance of `FunctionsAugmentation`
        /// </summary>
        public FunctionsAugmentation()
        {

        }

        /// <inheritdoc />
        public PromptSection? CreatePromptSection()
        {
            return null;
        }

        /// <inheritdoc />
        public async Task<Plan?> CreatePlanFromResponseAsync(ITurnContext context, IMemory memory, PromptResponse response, CancellationToken cancellationToken = default)
        {
            return await Task.FromResult(new Plan()
            {
                Commands =
                {
                    new PredictedSayCommand(response.Message?.Content ?? "")
                }
            });
        }

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
