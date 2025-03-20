using System.Text.Json;
using Microsoft.Bot.Builder;
using Microsoft.Bot.Builder.Teams;
using Microsoft.Bot.Schema;
using Microsoft.Bot.Schema.Teams;
using Microsoft.SemanticKernel;
using Microsoft.SemanticKernel.ChatCompletion;
using Microsoft.SemanticKernel.Connectors.OpenAI;
using Microsoft.Teams.AI.Application;

namespace OSSDevOpsAgent
{
    public class KernelOrchestrator
    {
        private Kernel _kernel;
        private IChatCompletionService _chatCompletionService;
        private OpenAIPromptExecutionSettings _openAIPromptExecutionSettings;
        private IStorage _storage;
        private ConfigOptions _config;

        /// <summary>
        /// Used to manage the chat history and
        /// orchestrate the conversations
        /// </summary>
        /// <param name="kernel">The kernel</param>
        /// <param name="storage">The storage</param>
        /// <param name="config">The configuration pairs</param>
        public KernelOrchestrator(Kernel kernel, IStorage storage, ConfigOptions config)
        {
            _kernel = kernel;
            _chatCompletionService = kernel.GetRequiredService<IChatCompletionService>();
            _openAIPromptExecutionSettings = new()
            {
                // Current plugins are invoked directly in Program.cs
                FunctionChoiceBehavior = FunctionChoiceBehavior.None(),
            };
            _storage = storage;
            _config = config;
        }

        /// <summary>
        /// Creates and adds to the chat history for the current turn
        /// </summary>
        /// <param name="turnContext">The turn context</param>
        /// <returns></returns>
        public async Task CreateChatHistory(ITurnContext turnContext)
        {
            List<ConversationInfo> prevConvos = await GetPreviousConvos();

            // Locate existing conversation, if any
            ConversationInfo currConvo = prevConvos.Find(x => x.Id == turnContext.Activity.Conversation.Id);

            if (currConvo == null)
            {
                currConvo = InitiateChat(turnContext.Activity);
            }
            else
            {
                prevConvos.Remove(currConvo);
            }

            ChatHistory history = JsonSerializer.Deserialize<ChatHistory>(currConvo.ChatHistory);
            history.AddUserMessage(turnContext.Activity.Text);
            await SerializeAndSaveHistory(history, currConvo, prevConvos);
        }

        /// <summary>
        /// Used for non-plugin scenarios, calls completion with streaming
        /// </summary>
        /// <param name="turnContext">The turn context</param>
        /// <returns></returns>
        public async Task GetChatMessageContentAsync(ITurnContext turnContext)
        {
            StreamingResponse streamer = new StreamingResponse(turnContext);
            streamer.EnableGeneratedByAILabel = true;
            streamer.QueueInformativeUpdate("Generating response...");

            List<ConversationInfo> prevConvos = await GetPreviousConvos();
            ConversationInfo currConvo = prevConvos.Find(x => x.Id == turnContext.Activity.Conversation.Id);
            ChatHistory history = JsonSerializer.Deserialize<ChatHistory>(currConvo.ChatHistory);
            prevConvos.Remove(currConvo);

            var result = _chatCompletionService.GetStreamingChatMessageContentsAsync(
               history,
               executionSettings: _openAIPromptExecutionSettings,
               kernel: _kernel);

            ChatMessageContent complete_result = new()
            {
                Role = AuthorRole.Assistant,
                Content = ""
            };

            await foreach (var chunk in result)
            {
                if (!string.IsNullOrEmpty(chunk.Content))
                {
                    await Task.Delay(TimeSpan.FromSeconds(0.03));
                    complete_result.Content.Concat(chunk.Content);
                    streamer.QueueTextChunk(chunk.Content);
                }
            }

            await streamer.EndStream();
            history.Add(complete_result);
            await SerializeAndSaveHistory(history, currConvo, prevConvos);
        }

        /// <summary>
        /// Saves the activity to the chat history
        /// </summary>
        /// <param name="turnContext">The turn context</param>
        /// <param name="activity">The activity text associated to the turn</param>
        /// <returns></returns>
        public async Task SaveActivityToChatHistory(ITurnContext turnContext, string activity)
        {
            List<ConversationInfo> prevConvos = await GetPreviousConvos();

            ConversationInfo currConvo = prevConvos.Find(x => x.Id == turnContext.Activity.Conversation.Id);
            ChatHistory history = JsonSerializer.Deserialize<ChatHistory>(currConvo.ChatHistory);
            prevConvos.Remove(currConvo);

            ChatMessageContent result = new ChatMessageContent()
            {
                Role = AuthorRole.Assistant,
                Content = activity,
            };

            history.Add(result);
            await SerializeAndSaveHistory(history, currConvo, prevConvos);
        }

        /// <summary>
        /// Initializes the chat history for a new conversation
        /// and sets up the system message to instruct the model
        /// </summary>
        /// <param name="activity">The activity</param>
        /// <returns></returns>
        public ConversationInfo InitiateChat(Activity activity)
        {
            ChatHistory chatHistory = new();
            chatHistory.AddSystemMessage(
                    "You are a GitHub Assistant. " +
                    "- You can list pull requests. " +
                    "- You send an adaptive card whenever there is a new assignee on a pull request. " +
                    "- You send an adaptive card whenever there is a status update on a pull request. " +
                    "All of the pull requests are in the Teams AI SDK repository. " +
                    "The purpose of GitHub Assistant is to help boost the team's productivity and quality of their engineering lifecycle.");

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

        /// <summary>
        /// Serializes the chat history and saves it to storage
        /// </summary>
        /// <param name="history">The history</param>
        /// <param name="currConvo">The current conversation</param>
        /// <param name="prevConvos">List of previous conversations</param>
        /// <returns></returns>
        private async Task SerializeAndSaveHistory(ChatHistory history, ConversationInfo currConvo, List<ConversationInfo> prevConvos)
        {
            string serializedHistory = JsonSerializer.Serialize(history);
            currConvo.ChatHistory = serializedHistory;

            // Replace storage with recent conversation
            prevConvos.Add(currConvo);
            Dictionary<string, object> updated_entries = new()
            {
                { "conversations", prevConvos }
            };
            await _storage.WriteAsync(updated_entries);
        }

        /// <summary>
        /// Retrieves the previous conversations from storage
        /// </summary>
        /// <returns>The list of previous conversations</returns>
        private async Task<List<ConversationInfo>> GetPreviousConvos()
        {
            IDictionary<string, object> entries = await _storage.ReadAsync(keys: new[] { "conversations" });

            List<ConversationInfo> prevConvos = new List<ConversationInfo>();

            if (entries.ContainsKey("conversations"))
            {
                prevConvos = (List<ConversationInfo>)entries["conversations"];
            }

            return prevConvos;
        }
    }
}
