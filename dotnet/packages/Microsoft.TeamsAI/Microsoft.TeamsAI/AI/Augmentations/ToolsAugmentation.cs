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
    /// A server-side 'tools' augmentation
    /// </summary>
    public class ToolsAugmentation : IAugmentation
    {
        /// <summary>
        /// Creates a plan given validated response value.
        /// </summary>
        /// <param name="context">Context for the current turn of conversation.</param>
        /// <param name="memory">Interface for accessing state variables.</param>
        /// <param name="response">Response to validate.</param>
        /// <param name="cancellationToken">The cancellation token.</param>
        /// <returns>The created plan</returns>
        public Task<Plan?> CreatePlanFromResponseAsync(ITurnContext context, IMemory memory, PromptResponse response, CancellationToken cancellationToken = default)
        {
            List<IPredictedCommand> commands = new();

            if (response.Message != null && response.Message.ActionCalls != null && response.Message.ActionCalls.Count() > 0)
            {
                IList<ActionCall> actionCalls = response.Message.ActionCalls;

                foreach (ActionCall actionCall in actionCalls)
                {
                    PredictedDoCommand command = new(actionCall.Function!.Name, actionCall.Function.Arguments)
                    {
                        ActionId = actionCall.Id,
                    };
                    commands.Add(command);
                }

                return Task.FromResult<Plan?>(new Plan(commands));
            }

            PredictedSayCommand sayCommand = new(response.Message!);
            commands.Add(sayCommand);

            return Task.FromResult<Plan?>(new Plan(commands));
        }

        /// <summary>
        /// Creates an optional prompt section for the augmentation.
        /// </summary>
        /// <returns></returns>
        public PromptSection? CreatePromptSection()
        {
            return null;
        }

        /// <summary>
        /// Validates a response to a prompt.
        /// </summary>
        /// <param name="context">Context for the current turn of conversation.</param>
        /// <param name="memory">Interface for accessing state variables.</param>
        /// <param name="tokenizer">Tokenizer to use for encoding/decoding text.</param>
        /// <param name="response">Response to validate.</param>
        /// <param name="remainingAttempts">Number of remaining attempts to validate the response.</param>
        /// <param name="cancellationToken">The cancellation token.</param>
        /// <returns>A Validation object.</returns>
        public Task<Validation> ValidateResponseAsync(ITurnContext context, IMemory memory, ITokenizer tokenizer, PromptResponse response, int remainingAttempts, CancellationToken cancellationToken = default)
        {
            return Task.FromResult(new Validation() { Valid = true });
        }
    }
}
