using Microsoft.Bot.Builder.M365.AI.Action;
using Microsoft.Bot.Builder.M365.AI.Prompt;
using Microsoft.Bot.Builder.M365.Exceptions;
using Microsoft.Extensions.Logging;
using Microsoft.SemanticKernel;
using Microsoft.SemanticKernel.AI.ChatCompletion;
using Microsoft.SemanticKernel.AI.TextCompletion;
using Microsoft.SemanticKernel.Connectors.AI.OpenAI.ChatCompletion;
using Microsoft.SemanticKernel.Connectors.AI.OpenAI.TextCompletion;
using Microsoft.SemanticKernel.SemanticFunctions;
using AIException = Microsoft.SemanticKernel.AI.AIException;
using PromptTemplate = Microsoft.Bot.Builder.M365.AI.Prompt.PromptTemplate;

namespace Microsoft.Bot.Builder.M365.AI.Planner
{
    /// <summary>
    /// A planner that uses OpenAI's textCompletion and chatCompletion API's to generate plans.
    /// </summary>
    /// <remarks>
    /// This planner can be configured to use different models for different prompts. The prompts model
    /// will determine which API is used to generate the plan.Any model that starts with 'gpt-' will
    /// use the chatCompletion API, otherwise the textCompletion API will be used.
    /// </remarks>
    public class OpenAIPlanner<TState, TOptions> : IPlanner<TState>
        where TState : TurnState
        where TOptions : OpenAIPlannerOptions
    {
        private TOptions _options { get; }
        private readonly IKernel _kernel;
        private PromptManager<TState> _promptManager;
        
        public OpenAIPlanner(TOptions options, PromptManager<TState> promptManager, ILogger logger)
        {
            // TODO: Configure Retry Handler
            _options = options;
            _promptManager = promptManager;
            _kernel = Kernel.Builder
                .WithDefaultAIService<ITextCompletion>(
                    new OpenAITextCompletion(
                        options.DefaultModel,
                        options.ApiKey,
                        options.Organization
                    )
                )
                .WithDefaultAIService<IChatCompletion>(
                    new OpenAIChatCompletion(
                        options.DefaultModel,
                        options.ApiKey,
                        options.Organization
                    )
                )
                .WithLogger(logger)
                .Build();   
        }

        /// <inheritdoc/>
        public async Task<string> CompletePromptAsync(ITurnContext turnContext, TState turnState, PromptTemplate promptTemplate, AIOptions<TState> options, CancellationToken cancellationToken = default)
        {
            string model = _GetModel(promptTemplate);
            try
            {
                if (model.StartsWith("gpt-", StringComparison.OrdinalIgnoreCase))
                {
                    // Request base chat completion
                    IChatResult response = await _CreateChatCompletion(turnState, options, promptTemplate, cancellationToken);
                    ChatMessageBase message = await response.GetChatMessageAsync(cancellationToken).ConfigureAwait(false);

                    return message.Content.ToString();
                }
                else
                {
                    // Request base text completion
                    ITextCompletionResult response = await _CreateTextCompletion(promptTemplate, cancellationToken);
                    return await response.GetCompletionAsync(cancellationToken).ConfigureAwait(false);
                }
            } 
            catch (Exception ex)
            {
                throw new PlannerException($"Failed to perform AI prompt completion: {ex.Message}", ex);
            };
        }

        /// <inheritdoc/>
        public async Task<Plan> GeneratePlanAsync(ITurnContext turnContext, TState turnState, PromptTemplate promptTemplate, AIOptions<TState> options, CancellationToken cancellationToken = default)
        {
            string result;
            try
            {
                result = await CompletePromptAsync(turnContext, turnState, promptTemplate, options, cancellationToken);
            } catch (PlannerException ex)
            {
                // Ensure we weren't rate limited
                if (ex.InnerException is AIException aiEx && aiEx.ErrorCode == AIException.ErrorCodes.Throttling)
                {
                    {
                        return new Plan
                        {
                            Commands =
                            {
                                new PredictedDoCommand(DefaultActionTypes.RateLimitedActionName)
                            }
                        };
                    }
                }

                throw;
            }


            if (result.Length > 0)
            {
                // Patch the occasional "Then DO" which gets predicted
                result = result.Trim().Replace("Then DO ", "THEN DO ").Replace("Then SAY ", "THEN SAY");
                if (result.StartsWith("THEN "))
                {
                    result = result.Substring(5);
                }

                // TODO: Remove response prefix - once Conversation History & TurnState is ported

                // Parse response into commands
                Plan plan = ResponseParser.ParseResponse(result.Trim());

                // Filter to only a single SAY command
                if (_options.OneSayPerTurn)
                {
                    bool spoken = false;
                    plan.Commands = plan.Commands.FindAll((command) =>
                    {
                        if (command.Type == AITypes.SayCommand)
                        {
                            if (spoken) { return false; }

                            spoken = true;
                        }

                        return true;
                    });
                }

                return plan;

            }

            // Return an empty plan by default
            return new Plan();
        }

        private async Task<ITextCompletionResult> _CreateTextCompletion(PromptTemplate promptTemplate, CancellationToken cancellationToken)
        {
                var skPromptTemplate = promptTemplate.Configuration.GetPromptTemplateConfig();

                ITextCompletion textCompletion = _kernel.GetService<ITextCompletion>();

                var completions = await textCompletion.GetCompletionsAsync(promptTemplate.Text, CompleteRequestSettings.FromCompletionConfig(skPromptTemplate.Completion), cancellationToken);
                return completions[0];
        }

        private async Task<IChatResult> _CreateChatCompletion(TState turnState, AIOptions<TState> options, PromptTemplate promptTemplate, CancellationToken cancellationToken)
        {
            PromptTemplateConfig templateConfig = promptTemplate.Configuration.GetPromptTemplateConfig();
            ChatRequestSettings chatRequestSettings = new()
            {
                Temperature = templateConfig.Completion.Temperature,
                TopP = templateConfig.Completion.TopP,
                PresencePenalty = templateConfig.Completion.PresencePenalty,
                FrequencyPenalty = templateConfig.Completion.FrequencyPenalty,
                StopSequences = templateConfig.Completion.StopSequences,
                MaxTokens = templateConfig.Completion.MaxTokens
            };

            var chatCompletion = _kernel.GetService<IChatCompletion>();

            // TODO: When turn state is implemented inject history
            var chatHistory = chatCompletion.CreateNewChat();

            // TODO: When turn state is implemented inject history
            // Users message
            chatHistory.AddUserMessage(promptTemplate.Text);

            var completions = await chatCompletion.GetChatCompletionsAsync(chatHistory, chatRequestSettings, cancellationToken);

            return completions[0];
        }

        private string _GetModel(PromptTemplate promptTemplate)
        {
            if (promptTemplate.Configuration.DefaultBackends.Count > 0)
            {
                return promptTemplate.Configuration.DefaultBackends[0];
            } else
            {
                return _options.DefaultModel;
            }
        }

    }
}
