using Microsoft.Bot.Builder;
using Microsoft.SemanticKernel;
using Microsoft.SemanticKernel.ChatCompletion;
using Microsoft.SemanticKernel.Connectors.OpenAI;
using OSSDevOpsAgent.Model;

namespace OSSDevOpsAgent
{
    public class KernelOrchestrator
    {
        private Kernel _kernel;
        private IChatCompletionService _chatCompletionService;
        private OpenAIPromptExecutionSettings _openAIPromptExecutionSettings;
        private AppState _state;
        private const string CONVERSATION_KERNEL_HISTORY = "conversation.KernelHistory";

        public KernelOrchestrator(Kernel kernel, AppState state)
        {
            _kernel = kernel;
            _chatCompletionService = kernel.GetRequiredService<IChatCompletionService>();
            _openAIPromptExecutionSettings = new()
            {
                FunctionChoiceBehavior = FunctionChoiceBehavior.Auto(),
            };
            _state = state;
        }

        public async Task<string> GetChatMessageContentAsync(ITurnContext turnContext)
        {
            ChatHistory chatHistory = LoadChatHistory();
            chatHistory.AddUserMessage(turnContext.Activity.Text);

            var result = await _chatCompletionService.GetChatMessageContentAsync(
               chatHistory,
               executionSettings: _openAIPromptExecutionSettings,
               kernel: _kernel);

            chatHistory.Add(result);
            _state.SetValue(CONVERSATION_KERNEL_HISTORY, chatHistory);

            return result.Content;
        }

        public ChatHistory LoadChatHistory()
        {
            ChatHistory? chatHistory = (ChatHistory?)_state.GetValue(CONVERSATION_KERNEL_HISTORY);

            if (chatHistory == null)
            {
                chatHistory = new();
                chatHistory.AddSystemMessage(
                    "You are a GitHub Assistant. " +
                    "- You can list and filter pull requests. " +
                    "- You send an adaptive card whenever there is a new assignee on a pull request. " +
                    "- You send an adaptive card whenever there is an update on a pull request. " +
                    "The assistant should always greet the human, ask for their name, and guide them in a friendly manner. " +
                    "All of the pull requests are in the Teams AI SDK repository. " +
                    "The purpose of GitHub Assistant is to help boost the team's productivity and quality of their engineering lifecycle.");
            }

            return chatHistory;
        }
    }
}
