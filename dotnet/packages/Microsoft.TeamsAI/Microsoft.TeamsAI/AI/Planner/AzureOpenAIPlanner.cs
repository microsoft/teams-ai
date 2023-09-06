using Microsoft.Extensions.Logging;
using Microsoft.SemanticKernel.AI.ChatCompletion;
using Microsoft.SemanticKernel.AI.TextCompletion;
using Microsoft.SemanticKernel.Connectors.AI.OpenAI.ChatCompletion;
using Microsoft.SemanticKernel.Connectors.AI.OpenAI.TextCompletion;
using Microsoft.TeamsAI.State;

namespace Microsoft.TeamsAI.AI.Planner
{
    /// <summary>
    /// Planner that uses the Azure OpenAI service.
    /// </summary>
    /// <typeparam name="TState">Type of the applications turn state</typeparam>
    public class AzureOpenAIPlanner<TState> : OpenAIPlanner<TState, AzureOpenAIPlannerOptions>
        where TState : ITurnState<StateBase, StateBase, TempState>
    {
        /// <summary>
        /// Creates a new instance of the <see cref="AzureOpenAIPlanner{TState}"/> class.
        /// </summary>
        /// <param name="options">The options to configure the planner.</param>
        /// <param name="logger">The logger instance.</param>
        public AzureOpenAIPlanner(AzureOpenAIPlannerOptions options, ILogger logger) : base(options, logger)
        {
        }

        private protected override ITextCompletion _CreateTextCompletionService(AzureOpenAIPlannerOptions options)
        {
            return new AzureTextCompletion(
                options.DefaultModel,
                options.Endpoint,
                options.ApiKey
            );
        }

        private protected override IChatCompletion _CreateChatCompletionService(AzureOpenAIPlannerOptions options)
        {
            return new AzureChatCompletion(
                options.DefaultModel,
                options.Endpoint,
                options.ApiKey
            );
        }
    }
}
