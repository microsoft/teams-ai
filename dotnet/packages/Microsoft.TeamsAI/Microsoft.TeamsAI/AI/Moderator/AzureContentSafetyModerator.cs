using Microsoft.Teams.AI.AI.Planner;
using Microsoft.Teams.AI.AI.Prompt;
using Microsoft.Teams.AI.State;
using Microsoft.Bot.Builder;
using Azure.AI.ContentSafety;
using Azure;

namespace Microsoft.Teams.AI.AI.Moderator
{
    /// <summary>
    /// An moderator that uses Azure Content Safety API.
    /// </summary>
    /// <typeparam name="TState">The turn state class.</typeparam>
    public class AzureContentSafetyModerator<TState> : IModerator<TState> where TState : ITurnState<StateBase, StateBase, TempState>
    {
        private readonly AzureContentSafetyModeratorOptions _options;
        private readonly ContentSafetyClient _client;

        /// <summary>
        /// Constructs an instance of the moderator.
        /// </summary>
        /// <param name="options">Options to configure the moderator.</param>
        public AzureContentSafetyModerator(AzureContentSafetyModeratorOptions options)
        {
            _options = options;
            _client = new ContentSafetyClient(new Uri(options.Endpoint), new AzureKeyCredential(options.ApiKey));
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
            AnalyzeTextOptions analyzeTextOptions = new(text);
            if (_options.Categories != null)
            {
                foreach (TextCategory category in _options.Categories)
                {
                    analyzeTextOptions.Categories.Add(category);
                }
            }
            if (_options.BlocklistNames != null)
            {
                foreach (string blocklistName in _options.BlocklistNames)
                {
                    analyzeTextOptions.BlocklistNames.Add(blocklistName);
                }
            }

            Response<AnalyzeTextResult> response = await _client.AnalyzeTextAsync(analyzeTextOptions);

            bool flagged = response.Value.BlocklistsMatchResults.Count > 0
            || _ShouldBeFlagged(response.Value.HateResult)
            || _ShouldBeFlagged(response.Value.SelfHarmResult)
            || _ShouldBeFlagged(response.Value.SexualResult)
            || _ShouldBeFlagged(response.Value.ViolenceResult);
            if (flagged)
            {
                string actionName = isModelInput ? AIConstants.FlaggedInputActionName : AIConstants.FlaggedOutputActionName;

                // Flagged
                return new Plan()
                {
                    Commands = new List<IPredictedCommand>
                            {
                                new PredictedDoCommand(actionName, new Dictionary<string, object?>
                                {
                                    { "Result", response.Value }
                                })
                            }
                };
            }

            return null;
        }

        private bool _ShouldBeFlagged(TextAnalyzeSeverityResult result)
        {
            return result != null && result.Severity >= _options.SeverityLevel;
        }
    }
}
