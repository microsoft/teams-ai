using Azure.AI.OpenAI;
using Microsoft.TeamsAI.AI.Action;
using Microsoft.TeamsAI.Exceptions;
using Microsoft.TeamsAI.Utilities;
using Microsoft.Extensions.Logging;
using Microsoft.SemanticKernel;
using Microsoft.SemanticKernel.AI.ChatCompletion;
using Microsoft.SemanticKernel.AI.TextCompletion;
using Microsoft.SemanticKernel.Connectors.AI.OpenAI.ChatCompletion;
using Microsoft.SemanticKernel.Connectors.AI.OpenAI.TextCompletion;
using Microsoft.SemanticKernel.SemanticFunctions;
using AIException = Microsoft.SemanticKernel.AI.AIException;
using PromptTemplate = Microsoft.TeamsAI.AI.Prompt.PromptTemplate;
using Microsoft.TeamsAI.State;
using Microsoft.Bot.Builder;
using System.Runtime.CompilerServices;

// For Unit Test
[assembly: InternalsVisibleTo("Microsoft.TeamsAI.Tests")]
namespace Microsoft.TeamsAI.AI.Planner
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
        where TState : ITurnState<StateBase, StateBase, TempState>
        where TOptions : OpenAIPlannerOptions
    {
        private TOptions _options { get; }
        private protected readonly IKernel _kernel;
        private readonly ILogger? _logger;
        public OpenAIPlanner(TOptions options, ILogger? logger = null)
        {
            // TODO: Configure Retry Handler
            _options = options;
            KernelBuilder builder = Kernel.Builder
                .WithDefaultAIService(_CreateTextCompletionService(options))
                .WithDefaultAIService(_CreateChatCompletionService(options));
            if (options.LogRequests && logger == null)
            {
                throw new ArgumentException("Logger parameter cannot be null if `LogRequests` option is set to true");
            }
            if (logger != null)
            {
                builder.WithLogger(logger);
                _logger = logger;
            }

            _kernel = builder.Build();
        }

        private protected virtual ITextCompletion _CreateTextCompletionService(TOptions options)
        {
            Verify.ParamNotNull(options);

            return new OpenAITextCompletion(
                options.DefaultModel,
                options.ApiKey,
                options.Organization
            );

        }

        private protected virtual IChatCompletion _CreateChatCompletionService(TOptions options)
        {
            Verify.ParamNotNull(options);

            return new OpenAIChatCompletion(
                options.DefaultModel,
                options.ApiKey,
                options.Organization
            );
        }

        /// <inheritdoc/>
        public virtual async Task<string> CompletePromptAsync(ITurnContext turnContext, TState turnState, PromptTemplate promptTemplate, AIOptions<TState> options, CancellationToken cancellationToken = default)
        {
            Verify.ParamNotNull(turnContext);
            Verify.ParamNotNull(turnState);
            Verify.ParamNotNull(options);

            string model = _GetModel(promptTemplate);
            string result;
            int completionTokens;
            int promptTokens;
            bool isChatCompletion = model.StartsWith("gpt-", StringComparison.OrdinalIgnoreCase);

            try
            {
                DateTime startTime = DateTime.Now;
                string prefix = isChatCompletion ? "CHAT" : "PROMPT";

                _logger?.LogInformation($"\n{prefix} REQUEST: \n\'\'\'\n{promptTemplate.Text}\n\'\'\'");

                if (isChatCompletion)
                {
                    string? userMessage = turnState?.Temp?.Input;

                    // Request base chat completion
                    IChatResult response = await _CreateChatCompletion(turnState!, options, promptTemplate, userMessage, cancellationToken);
                    ChatMessageBase message = await response.GetChatMessageAsync(cancellationToken).ConfigureAwait(false);
                    CompletionsUsage usage = ((ITextResult)response).ModelResult.GetOpenAIChatResult().Usage;

                    completionTokens = usage.CompletionTokens;
                    promptTokens = usage.PromptTokens;
                    result = message.Content.ToString();
                }
                else
                {
                    // Request base text completion
                    ITextResult response = await _CreateTextCompletion(promptTemplate, cancellationToken);
                    CompletionsUsage usage = response.ModelResult.GetOpenAITextResult().Usage;

                    completionTokens = usage.CompletionTokens;
                    promptTokens = usage.PromptTokens;
                    result = await response.GetCompletionAsync(cancellationToken).ConfigureAwait(false);
                }

                // Response succeeded with a completion
                TimeSpan duration = DateTime.Now - startTime;

                _logger?.LogInformation($"\n{prefix} SUCCEEDED: duration={duration.TotalSeconds} prompt={promptTokens} completion={completionTokens} response={result}");

                return result;
            }
            catch (Exception ex)
            {
                throw new TeamsAIException($"Failed to perform AI prompt completion: {ex.Message}", ex);
            }
        }

        /// <inheritdoc/>
        public async Task<Plan> GeneratePlanAsync(ITurnContext turnContext, TState turnState, PromptTemplate promptTemplate, AIOptions<TState> options, CancellationToken cancellationToken = default)
        {
            Verify.ParamNotNull(turnContext);
            Verify.ParamNotNull(turnState);
            Verify.ParamNotNull(options);

            string result;
            try
            {
                result = await CompletePromptAsync(turnContext, turnState, promptTemplate, options, cancellationToken);
            }
            catch (TeamsAIException ex)
            {
                // Ensure we weren't rate limited
                if (ex.InnerException is AIException aiEx && aiEx.ErrorCode == AIException.ErrorCodes.Throttling)
                {
                    Plan plan = new();
                    plan.Commands.Add(new PredictedDoCommand(DefaultActionTypes.RateLimitedActionName));
                    return plan;
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

                string? assistantPrefix = options.History?.AssistantPrefix;

                if (assistantPrefix != null)
                {
                    // The model sometimes predicts additional text for the human side of things so skip that.
                    int position = result.ToLower().IndexOf(assistantPrefix.ToLower());
                    if (position >= 0)
                    {
                        result = result.Substring(position + assistantPrefix.Length);
                    }

                }

                // Parse response into commands
                Plan? plan;
                try
                {
                    plan = ResponseParser.ParseResponse(result.Trim());
                    Verify.ParamNotNull(plan);
                }
                catch (Exception ex)
                {
                    throw new TeamsAIException($"Failed to generate plan from model response: {ex.Message}", ex);
                }


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

        private async Task<ITextResult> _CreateTextCompletion(PromptTemplate promptTemplate, CancellationToken cancellationToken)
        {
            Verify.ParamNotNull(promptTemplate);

            PromptTemplateConfig skPromptTemplate = promptTemplate.Configuration.GetPromptTemplateConfig();

            ITextCompletion textCompletion = _kernel.GetService<ITextCompletion>();

            IReadOnlyList<ITextResult> completions = await textCompletion.GetCompletionsAsync(promptTemplate.Text, CompleteRequestSettings.FromCompletionConfig(skPromptTemplate.Completion), cancellationToken);
            return completions[0];
        }

        private async Task<IChatResult> _CreateChatCompletion(TState turnState, AIOptions<TState> aiOptions, PromptTemplate promptTemplate, string? userMessage, CancellationToken cancellationToken)
        {
            Verify.ParamNotNull(turnState);
            Verify.ParamNotNull(aiOptions);
            Verify.ParamNotNull(promptTemplate);

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

            IChatCompletion chatCompletion = _kernel.GetService<IChatCompletion>();

            ChatHistory chatHistory = chatCompletion.CreateNewChat();


            if (_options.UseSystemMessage)
            {
                chatHistory.AddSystemMessage(promptTemplate.Text);
            }
            else
            {
                chatHistory.AddUserMessage(promptTemplate.Text);
            }

            // Populate Conversation History
            if (aiOptions.History != null && aiOptions.History.TrackHistory)
            {
                string userPrefix = aiOptions.History.UserPrefix;
                string assistantPrefix = aiOptions.History.AssistantPrefix;
                string[] history = ConversationHistory.ToArray(turnState, aiOptions.History.MaxTokens);

                for (int i = 0; i < history.Length; i++)
                {
                    string line = history[i];
                    if (line.StartsWith(userPrefix, StringComparison.OrdinalIgnoreCase))
                    {
                        line = line.Substring(userPrefix.Length).Trim();

                        chatHistory.AddUserMessage(line);
                    }
                    else if (line.StartsWith(assistantPrefix, StringComparison.OrdinalIgnoreCase))
                    {
                        line = line.Substring(assistantPrefix.Length).Trim();
                        chatHistory.AddAssistantMessage(line);
                    }
                }
            }

            // Add user message
            if (userMessage != null)
            {
                chatHistory.AddUserMessage(userMessage);
            }

            IReadOnlyList<IChatResult> completions = await chatCompletion.GetChatCompletionsAsync(chatHistory, chatRequestSettings, cancellationToken);

            return completions[0];
        }

        private string _GetModel(PromptTemplate promptTemplate)
        {
            if (promptTemplate.Configuration.DefaultBackends.Count > 0)
            {
                return promptTemplate.Configuration.DefaultBackends[0];
            }
            else
            {
                return _options.DefaultModel;
            }
        }

    }

    /// <inheritdoc/>
    public class OpenAIPlanner<TState> : OpenAIPlanner<TState, OpenAIPlannerOptions> where TState : ITurnState<StateBase, StateBase, TempState>
    {
        public OpenAIPlanner(OpenAIPlannerOptions options, ILogger? logger = null) : base(options, logger)
        {
        }
    }
}
