using System.Text.Json;
using Microsoft.Bot.Builder;
using Microsoft.Bot.Builder.Teams;
using Microsoft.Bot.Schema;
using Microsoft.Bot.Schema.Teams;
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

            List<ConversationInfo> prevConvos = new List<ConversationInfo>();

            if (entries.ContainsKey("conversations"))
            {
                prevConvos = (List<ConversationInfo>)entries["conversations"];
            }

            // Locate existing conversation, if any
            ConversationInfo currConvo = prevConvos.Find(x => x.Id == turnContext.Activity.Conversation.Id);

            if (currConvo == null)
            {
                currConvo = InitiateChat(turnContext.Activity);
            }
            else
            {
                // Remove to update
                prevConvos.Remove(currConvo);
            }

            ChatHistory history = JsonSerializer.Deserialize<ChatHistory>(currConvo.ChatHistory);
            history.AddUserMessage(turnContext.Activity.Text);

            var result = await _chatCompletionService.GetChatMessageContentAsync(
               history,
               executionSettings: _openAIPromptExecutionSettings,
               kernel: _kernel);

            history.Add(result);

            // Update history
            string serializedHistory = JsonSerializer.Serialize(history);
            currConvo.ChatHistory = serializedHistory;

            // Replace storage with recent conversation
            prevConvos.Add(currConvo);
            Dictionary<string, object> updated_entries = new()
            {
                { "conversations", prevConvos }
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
                    "All of the pull requests are in the Teams AI SDK repository. " +
                    "The purpose of GitHub Assistant is to help boost the team's productivity and quality of their engineering lifecycle.");

            // Update history
            string serializedHistory = JsonSerializer.Serialize(chatHistory);

            ConversationInfo convo = new ConversationInfo()
            {
                BotId = _config.BOT_ID,
                Id = activity.Conversation.Id,
                ServiceUrl = activity.ServiceUrl,
                ChatHistory = serializedHistory,
                IsGroup = (activity.Conversation.IsGroup != null) ? (bool)activity.Conversation.IsGroup : false,
            };

            if (string.Equals(activity.Conversation.ConversationType, "channel"))
            {
                TeamInfo teamInfo = activity.TeamsGetTeamInfo();
                var channelData = activity.GetChannelData<TeamsChannelData>();
                convo.TeamId = teamInfo.Id;
                convo.ChannelId = channelData.Channel.Id;
            }

            return convo;
        }
    }
}
