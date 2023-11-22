using Microsoft.Bot.Builder;
using Microsoft.Teams.AI.AI.Planners;
using Microsoft.Teams.AI.AI.Prompts;
using Microsoft.Teams.AI.AI.Prompts.Sections;
using Microsoft.Teams.AI.AI.Validators;
using Microsoft.Teams.AI.State;

namespace Microsoft.Teams.AI.AI.Augmentations
{
    /// <summary>
    /// Creates an optional prompt section for the augmentation.
    /// </summary>
    public interface IAugmentation : IPromptResponseValidator
    {
        /// <summary>
        /// Creates an optional prompt section for the augmentation.
        /// </summary>
        /// <returns></returns>
        public PromptSection? CreatePromptSection();

        /// <summary>
        /// Creates a plan given validated response value.
        /// </summary>
        /// <param name="context">Context for the current turn of conversation.</param>
        /// <param name="memory">An interface for accessing state variables.</param>
        /// <param name="response">The validated and transformed response for the prompt.</param>
        /// <returns></returns>
        public Task<Plan?> CreatePlanFromResponseAsync(ITurnContext context, IMemory memory, PromptResponse response);
    }
}
