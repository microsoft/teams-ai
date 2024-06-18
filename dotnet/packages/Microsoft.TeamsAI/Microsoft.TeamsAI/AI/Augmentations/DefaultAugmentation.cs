using Microsoft.Bot.Builder;
using Microsoft.Teams.AI.AI.Models;
using Microsoft.Teams.AI.AI.Planners;
using Microsoft.Teams.AI.AI.Prompts;
using Microsoft.Teams.AI.AI.Prompts.Sections;
using Microsoft.Teams.AI.AI.Tokenizers;
using Microsoft.Teams.AI.AI.Validators;
using Microsoft.Teams.AI.State;

namespace Microsoft.Teams.AI.AI.Augmentations
{
    /// <summary>
    /// Default Augmentation
    /// </summary>
    public class DefaultAugmentation : IAugmentation
    {
        /// <summary>
        /// Creates an instance of `DefaultAugmentation`
        /// </summary>
        public DefaultAugmentation()
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
            PredictedSayCommand say = new(response.Message?.GetContent<string>() ?? "");

            if (response.Message != null)
            {
                ChatMessage message = new(ChatRole.Assistant)
                {
                    Context = response.Message!.Context,
                    Content = response.Message.Content
                };

                say.Response = message;
            }

            return await Task.FromResult(new Plan()
            {
                Commands = { say }
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
