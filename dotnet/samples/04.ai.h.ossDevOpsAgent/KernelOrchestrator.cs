using Microsoft.Bot.Builder;
using Microsoft.Bot.Schema;
using Microsoft.SemanticKernel;
using Microsoft.SemanticKernel.ChatCompletion;
using Microsoft.SemanticKernel.Connectors.OpenAI;

namespace OSSDevOpsAgent
{
    public class KernelOrchestrator
    {
        private Kernel _kernel;
        private IChatCompletionService _chatCompletionService;
        private OpenAIPromptExecutionSettings _openAIPromptExecutionSettings;
        private IStorage _storage;
        private ConfigOptions _config;

        public KernelOrchestrator(Kernel kernel, IStorage storage, ConfigOptions config)
        {
            _kernel = kernel;
            _chatCompletionService = kernel.GetRequiredService<IChatCompletionService>();
            _openAIPromptExecutionSettings = new()
            {
                FunctionChoiceBehavior = FunctionChoiceBehavior.Auto(),
            };
            _storage = storage;
            _config = config;
        }

        public async Task<string> GetChatMessageContentAsync(ITurnContext turnContext)
        {
            IDictionary<string, object> entries = await _storage.ReadAsync(keys: new[] { "conversations" });

            List<ConversationInfo> prev_convos = new List<ConversationInfo>();

            if (entries.ContainsKey("conversations"))
            {
                prev_convos = (List<ConversationInfo>)entries["conversations"];
            }

            ConversationInfo curr_convo = prev_convos.Find(x => x.Id == turnContext.Activity.Conversation.Id);

            if (curr_convo == null)
            {
                curr_convo = InitiateChat(turnContext.Activity);
            }
            else
            {
                prev_convos.Remove(curr_convo);
            }

            //curr_convo.ChatHistory.AddUserMessage(turnContext.Activity.Text);

            var result = await _chatCompletionService.GetChatMessageContentAsync(
               //curr_convo.ChatHistory,
               turnContext.Activity.Text,
               executionSettings: _openAIPromptExecutionSettings,
               kernel: _kernel);

            //curr_convo.ChatHistory.Add(result);

            // Update storage
            prev_convos.Add(curr_convo);
            Dictionary<string, object> updated_entries = new()
            {
                { "conversations", prev_convos }
            };
            await _storage.WriteAsync(updated_entries);

            return result.Content;
        }

        public ConversationInfo InitiateChat(Activity activity)
        {
            ChatHistory chatHistory = new();
            chatHistory.AddSystemMessage(
                    "You are a GitHub Assistant. " +
                    "- You can list and filter pull requests. " +
                    "- You send an adaptive card whenever there is a new assignee on a pull request. " +
                    "- You send an adaptive card whenever there is an update on a pull request. " +
                    "The assistant should always greet the human, ask for their name, and guide them in a friendly manner. " +
                    "All of the pull requests are in the Teams AI SDK repository. " +
                    "The purpose of GitHub Assistant is to help boost the team's productivity and quality of their engineering lifecycle.");

            ConversationInfo convo = new ConversationInfo()
            {
                BotId = _config.BOT_ID,
                Id = activity.Conversation.Id,
                ServiceUrl = activity.ServiceUrl,
                //ChatHistory = chatHistory,
                IsGroup = (activity.Conversation.IsGroup != null) ? (bool)activity.Conversation.IsGroup : false
            };

            return convo;
        }
    }
}
