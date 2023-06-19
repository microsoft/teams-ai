using Microsoft.Bot.Builder.M365.AI.Prompt;
using Microsoft.Extensions.Logging;
using Microsoft.SemanticKernel.AI.ChatCompletion;
using Microsoft.SemanticKernel.AI.TextCompletion;
using Microsoft.SemanticKernel.Connectors.AI.OpenAI.ChatCompletion;
using Microsoft.SemanticKernel.Connectors.AI.OpenAI.TextCompletion;

namespace Microsoft.Bot.Builder.M365.AI.Planner
{
    /// <summary>
    /// Planner that uses the Azure OpenAI service.
    /// </summary>
    /// <typeparam name="TState">Type of the applications turn state</typeparam>
    public class AzureOpenAIPlanner<TState> : OpenAIPlanner<TState, AzureOpenAIPlannerOptions>
        where TState : TurnState
    {
        public AzureOpenAIPlanner(AzureOpenAIPlannerOptions options, PromptManager<TState> promptManager, ILogger logger) : base(options, promptManager, logger)
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
