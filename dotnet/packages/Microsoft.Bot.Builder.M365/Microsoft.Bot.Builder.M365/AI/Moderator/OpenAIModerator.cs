using Microsoft.Bot.Builder.M365.AI.Action;
using Microsoft.Bot.Builder.M365.AI.Planner;
using Microsoft.Bot.Builder.M365.AI.Prompt;
using Microsoft.Bot.Builder.M365.Exceptions;
using Microsoft.Bot.Builder.M365.OpenAI;
using Microsoft.Extensions.Logging;
using Microsoft.Bot.Builder.M365.State;

namespace Microsoft.Bot.Builder.M365.AI.Moderator
{
    /// <summary>
    /// An moderator that uses OpenAI's moderation API.
    /// </summary>
    /// <typeparam name="TState"></typeparam>
    public class OpenAIModerator<TState> : IModerator<TState> where TState : ITurnState<StateBase, StateBase, TempState>
    {
        private readonly OpenAIModeratorOptions _options;
        private readonly OpenAIClient _client;

        /// <summary>
        /// Constructs an instance of the moderator.
        /// </summary>
        /// <param name="options">Options to configure the moderator</param>
        /// <param name="logger">A logger instance</param>
        /// <param name="httpClient">HTTP client.</param>
        public OpenAIModerator(OpenAIModeratorOptions options, ILogger? logger = null, HttpClient? httpClient = null)
        {
            _options = options;

            OpenAIClientOptions clientOptions = new(_options.ApiKey)
            {
                Organization = _options.Organization,
            };

            _client = new OpenAIClient(clientOptions, logger, httpClient);
        }

        /// <inheritdoc />
        public async Task<Plan?> ReviewPrompt(ITurnContext turnContext, TState turnState, PromptTemplate prompt)
        {
            switch (_options.Moderate)
            {
                case ModerationType.Input:
                case ModerationType.Both:
                {
                    string input = turnState.Temp?.Input ?? turnContext.Activity.Text;

                    return await _HandleTextModeration(input, true);
                }
                default:
                    break;
            }

            return null;
        }

        /// <inheritdoc />
        public async Task<Plan> ReviewPlan(ITurnContext turnContext, TState turnState, Plan plan)
        {
            switch (_options.Moderate)
            {
                case ModerationType.Output:
                case ModerationType.Both:
                    {
                        foreach (IPredictedCommand command in plan.Commands)
                        {
                            if (command is PredictedSayCommand sayCommand)
                            {
                                string output = sayCommand.Response;

                                // If plan is flagged it will be replaced
                                Plan? newPlan = await _HandleTextModeration(output, false);

                                return newPlan ?? plan;
                            }
                        }

                        break;
                    }
                default:
                    break;
            }

            return plan;
        }

        private async Task<Plan?> _HandleTextModeration(string text, bool isModelInput)
        {
            try
            {
                ModerationResponse response = await _client.ExecuteTextModeration(text, _options.Model);
                ModerationResult? result = response.Results.Count > 0 ? response.Results[0] : null;
                
                if (result != null)
                {
                    if (result.Flagged)
                    {
                        string actionName = isModelInput ? DefaultActionTypes.FlaggedInputActionName : DefaultActionTypes.FlaggedOutputActionName;

                        // Flagged
                        return new Plan()
                        {
                            Commands = new List<IPredictedCommand>
                            {
                                new PredictedDoCommand(actionName, new Dictionary<string, object>
                                {
                                    { "Result", result }
                                })
                            }
                        };
                    }
                }

                return null;

            } catch (OpenAIClientException e)
            {
                // Rate limited
                if (e.statusCode != null && (int)e.statusCode == 429)
                {
                    return new Plan()
                    {
                        Commands = new List<IPredictedCommand>
                        {
                            new PredictedDoCommand(DefaultActionTypes.RateLimitedActionName)
                        }
                    };

                }

                throw;
            }
        }
    }
}
