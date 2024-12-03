using Microsoft.Teams.AI.AI.Planners;
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
    public class AzureContentSafetyModerator<TState> : IModerator<TState> where TState : TurnState
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
        public async Task<Plan?> ReviewInputAsync(ITurnContext turnContext, TState turnState, CancellationToken cancellationToken = default)
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
        public async Task<Plan> ReviewOutputAsync(ITurnContext turnContext, TState turnState, Plan plan, CancellationToken cancellationToken = default)
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
                            string output = sayCommand.Response.GetContent<string>();

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
                foreach (AzureContentSafetyTextCategory category in _options.Categories)
                {
                    analyzeTextOptions.Categories.Add(category.ToTextCategory());
                }
            }
            if (_options.BlocklistNames != null)
            {
                foreach (string blocklistName in _options.BlocklistNames)
                {
                    analyzeTextOptions.BlocklistNames.Add(blocklistName);
                }
            }

            try
            {
                Response<AnalyzeTextResult> response = await _client.AnalyzeTextAsync(analyzeTextOptions);

                bool flagged = response.Value.BlocklistsMatch.Count > 0
                || response.Value.CategoriesAnalysis.Any((ca) => _ShouldBeFlagged(ca));
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
                                    { "Result", BuildModerationResult(response.Value) }
                                })
                            }
                    };
                }

            }
            catch (RequestFailedException e)
            {
                // Http error
                if (e.Status == 429)
                {
                    return new Plan()
                    {
                        Commands = new List<IPredictedCommand>
                        {
                            new PredictedDoCommand(AIConstants.HttpErrorActionName)
                        }
                    };
                }
                throw;
            }

            return null;
        }

        private bool _ShouldBeFlagged(TextCategoriesAnalysis result)
        {
            return result != null && result.Severity >= _options.SeverityLevel;
        }

        private ModerationResult BuildModerationResult(AnalyzeTextResult result)
        {
            bool hate = false;
            int hateSeverity = 0;
            bool selfHarm = false;
            int selfHarmSeverity = 0;
            bool sexual = false;
            int sexualSeverity = 0;
            bool violence = false;
            int violenceSeverity = 0;

            foreach (TextCategoriesAnalysis textAnalysis in result.CategoriesAnalysis)
            {
                if (textAnalysis.Severity < _options.SeverityLevel)
                {
                    continue;
                }

                int severity = textAnalysis.Severity ?? 0;
                if (textAnalysis.Category == TextCategory.Hate)
                {
                    hate = true;
                    hateSeverity = severity;
                }

                if (textAnalysis.Category == TextCategory.Violence)
                {
                    violence = true;
                    violenceSeverity = severity;
                }

                if (textAnalysis.Category == TextCategory.SelfHarm)
                {
                    selfHarm = true;
                    selfHarmSeverity = severity;
                }

                if (textAnalysis.Category == TextCategory.Sexual)
                {
                    sexual = true;
                    sexualSeverity = severity;
                }
            }

            return new()
            {
                Flagged = true,
                CategoriesFlagged = new()
                {
                    Hate = hate,
                    HateThreatening = hate,
                    SelfHarm = selfHarm,
                    Sexual = sexual,
                    SexualMinors = sexual,
                    Violence = violence,
                    ViolenceGraphic = violence
                },
                CategoryScores = new()
                {
                    // Normalize the scores to be between 0 and 1 (highest severity is 6)
                    Hate = hateSeverity / 6.0,
                    HateThreatening = hateSeverity / 6.0,
                    SelfHarm = selfHarmSeverity / 6.0,
                    Sexual = sexualSeverity / 6.0,
                    SexualMinors = sexualSeverity / 6.0,
                    Violence = violenceSeverity / 6.0,
                    ViolenceGraphic = violenceSeverity / 6.0
                }
            };
        }
    }
}
