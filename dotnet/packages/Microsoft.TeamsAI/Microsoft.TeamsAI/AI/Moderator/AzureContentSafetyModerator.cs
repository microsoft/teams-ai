using Microsoft.TeamsAI.AI.Action;
using Microsoft.TeamsAI.AI.AzureContentSafety;
using Microsoft.TeamsAI.AI.Planner;
using Microsoft.TeamsAI.AI.Prompt;
using Microsoft.TeamsAI.State;
using Microsoft.Extensions.Logging;
using Microsoft.Bot.Builder;

namespace Microsoft.TeamsAI.AI.Moderator
{
    /// <summary>
    /// An moderator that uses Azure Content Safety API.
    /// </summary>
    /// <typeparam name="TState"></typeparam>
    public class AzureContentSafetyModerator<TState> : IModerator<TState> where TState : ITurnState<StateBase, StateBase, TempState>
    {
        private readonly AzureContentSafetyModeratorOptions _options;
        private readonly AzureContentSafetyClient _client;

        /// <summary>
        /// Constructs an instance of the moderator.
        /// </summary>
        /// <param name="options">Options to configure the moderator.</param>
        /// <param name="logger">A logger instance.</param>
        /// <param name="httpClient">HTTP client.</param>
        public AzureContentSafetyModerator(AzureContentSafetyModeratorOptions options, ILogger? logger = null, HttpClient? httpClient = null)
        {
            _options = options;

            AzureContentSafetyClientOptions clientOptions = new(_options.ApiKey, _options.Endpoint)
            {
                ApiVersion = _options.ApiVersion,
            };

            _client = new AzureContentSafetyClient(clientOptions, logger, httpClient);
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
            AzureContentSafetyTextAnalysisRequest request = new AzureContentSafetyTextAnalysisRequest(text)
            {
                BlocklistNames = _options.BlocklistNames,
                Categories = _options.Categories,
                BreakByBlocklists = _options.BreakByBlocklists,
            };

            AzureContentSafetyTextAnalysisResponse response = await _client.ExecuteTextModeration(request);

            bool flagged = response.BlocklistsMatchResults.Count > 0
                || _ShouldBeFlagged(response.HateResult)
                || _ShouldBeFlagged(response.SelfHarmResult)
                || _ShouldBeFlagged(response.SexualResult)
                || _ShouldBeFlagged(response.ViolenceResult);
            if (flagged)
            {
                string actionName = isModelInput ? DefaultActionTypes.FlaggedInputActionName : DefaultActionTypes.FlaggedOutputActionName;

                // Flagged
                return new Plan()
                {
                    Commands = new List<IPredictedCommand>
                            {
                                new PredictedDoCommand(actionName, new Dictionary<string, object>
                                {
                                    { "Result", response }
                                })
                            }
                };
            }

            return null;
        }

        private bool _ShouldBeFlagged(AzureContentSafetyHarmCategoryResult? result)
        {
            return result != null && result.Severity >= _options.SeverityLevel;
        }
    }
}
