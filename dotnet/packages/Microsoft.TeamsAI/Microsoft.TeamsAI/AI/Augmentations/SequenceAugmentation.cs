using Json.More;
using Microsoft.Bot.Builder;
using Microsoft.Teams.AI.AI.Models;
using Microsoft.Teams.AI.AI.Planners;
using Microsoft.Teams.AI.AI.Prompts;
using Microsoft.Teams.AI.AI.Prompts.Sections;
using Microsoft.Teams.AI.AI.Tokenizers;
using Microsoft.Teams.AI.AI.Validators;
using Microsoft.Teams.AI.State;
using System.Text.Json;

namespace Microsoft.Teams.AI.AI.Augmentations
{
    /// <summary>
    /// Sequence Augmentation
    /// </summary>
    public class SequenceAugmentation : IAugmentation
    {
        private readonly ActionAugmentationSection _section;
        private readonly JsonResponseValidator _planValidator;
        private readonly ActionResponseValidator _actionValidator;

        /// <summary>
        /// Creates an instance of `SequenceAugmentation`
        /// </summary>
        /// <param name="actions"></param>
        public SequenceAugmentation(List<ChatCompletionAction> actions)
        {
            this._section = new(actions, string.Join("\n", new string[]
            {
                "Use the actions above to create a plan in the following JSON format:",
                "{\"type\":\"plan\",\"commands\":[{\"type\":\"DO\",\"action\":\"<name>\",\"parameters\":{\"<name>\":<value>}},{\"type\":\"SAY\",\"response\":\"<response>\"}]}"
            }));

            this._planValidator = new(Plan.Schema(), "Return a JSON object that uses the SAY command to say what you're thinking.");
            this._actionValidator = new(actions, true);
        }

        /// <inheritdoc />
        public PromptSection? CreatePromptSection()
        {
            return this._section;
        }

        /// <inheritdoc />
        public async Task<Plan?> CreatePlanFromResponseAsync(ITurnContext context, IMemory memory, PromptResponse response, CancellationToken cancellationToken = default)
        {
            try
            {
                Plan? plan = JsonSerializer.Deserialize<Plan>(response.Message?.GetContent<string>() ?? "");

                if (plan != null)
                {
                    foreach (IPredictedCommand cmd in plan.Commands)
                    {
                        if (cmd is PredictedSayCommand say)
                        {
                            ChatMessage message = response.Message ?? new ChatMessage(ChatRole.Assistant)
                            {
                                Context = response.Message?.Context,
                            };

                            message.Content = say.Response.Content;
                            say.Response = message;
                        }
                    }
                }

                return await Task.FromResult(plan);
            }
            catch (Exception)
            {
                return await Task.FromResult<Plan?>(null);
            }
        }

        /// <inheritdoc />
        public async Task<Validation> ValidateResponseAsync(ITurnContext context, IMemory memory, ITokenizer tokenizer, PromptResponse response, int remainingAttempts, CancellationToken cancellationToken = default)
        {
            Validation validation = await this._planValidator.ValidateResponseAsync(context, memory, tokenizer, response, remainingAttempts, cancellationToken);

            if (!validation.Valid)
            {
                return new()
                {
                    Valid = false,
                    Feedback = validation.Feedback
                };
            }

            Plan? plan = ((Dictionary<string, JsonElement>?)validation.Value)?.AsJsonElement().Deserialize<Plan>();

            if (plan == null)
            {
                return new()
                {
                    Valid = false,
                    Feedback = "plan response could not be deserialized"
                };
            }

            foreach (IPredictedCommand command in plan.Commands)
            {
                Validation? valid;

                if (command.Type == "DO")
                {
                    valid = await this._ValidateDoCommandAsync(context, memory, tokenizer, remainingAttempts, command, cancellationToken);

                    if (valid != null)
                    {
                        return valid;
                    }
                }
                else if (command.Type == "SAY")
                {
                    valid = await this._ValidateSayCommandAsync(command, cancellationToken);

                    if (valid != null)
                    {
                        return valid;
                    }
                }
                else
                {
                    return new()
                    {
                        Valid = false,
                        Feedback = $"The plan JSON contains an unknown command type of {command.Type}. Only use DO or SAY commands"
                    };
                }
            }

            return new()
            {
                Valid = validation.Valid,
                Feedback = validation.Feedback,
                Value = plan
            };
        }

        private async Task<Validation?> _ValidateDoCommandAsync(ITurnContext context, IMemory memory, ITokenizer tokenizer, int remainingAttempts, IPredictedCommand command, CancellationToken cancellationToken = default)
        {
            PredictedDoCommand? doCommand = command as PredictedDoCommand;

            if (doCommand == null)
            {
                return new()
                {
                    Valid = false,
                    Feedback = $"One or more plan commands is invalid"
                };
            }

            string parameters = JsonSerializer.Serialize(doCommand.Parameters);
            PromptResponse promptResponse = new()
            {
                Status = PromptResponseStatus.Success,
                Message = new(ChatRole.Assistant)
                {
                    FunctionCall = new(doCommand.Action, parameters)
                }
            };

            Validation valid = await this._actionValidator.ValidateResponseAsync(context, memory, tokenizer, promptResponse, remainingAttempts, cancellationToken);

            if (!valid.Valid)
            {
                return new()
                {
                    Valid = false,
                    Feedback = valid.Feedback
                };
            }

            return null;
        }

        private async Task<Validation?> _ValidateSayCommandAsync(IPredictedCommand command, CancellationToken cancellationToken = default)
        {
            PredictedSayCommand? sayCommand = command as PredictedSayCommand;

            if (sayCommand == null)
            {
                return new()
                {
                    Valid = false,
                    Feedback = $"One or more plan commands is invalid"
                };
            }

            return await Task.FromResult<Validation?>(null);
        }
    }
}
