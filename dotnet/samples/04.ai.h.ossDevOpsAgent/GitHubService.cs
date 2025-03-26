using Microsoft.Bot.Builder;
using Microsoft.Bot.Schema.Teams;
using Microsoft.Bot.Schema;
using DevOpsAgent.Interfaces;
using Microsoft.Teams.AI;

namespace DevOpsAgent
{
    /// <summary>
    /// Handles GitHub webhooks and events.
    /// </summary>
    public class GitHubService : IRepositoryService
    {
        public GitHubService(MemoryStorage storage, TeamsAdapter adapter, IRepositoryPlugin plugin) : base()
        {
            Storage = storage;
            Adapter = adapter;
            RepositoryPlugin = plugin;
        }

        public override async Task HandleWebhook(dynamic payload, HttpRequest request, HttpResponse response, CancellationToken cancellationToken)
        {

            var eventType = request.Headers["x-github-event"].ToString();

            var prLabels = new List<string>() { "closed", "opened", "reopened", "ready_for_review" };

            // Handle pull request assignment events
            if (eventType == "pull_request" && (payload.action == "assigned"))
            {
                await HandlePRAssignments(payload, cancellationToken);
            } // Handle pull request state changes
            else if (eventType == "pull_request" && (prLabels.Contains(payload.action.ToString())))
            {
                await HandlePRStatusChanges(payload, cancellationToken);
            }

            response.StatusCode = 200;
            await response.WriteAsync("Event received", cancellationToken);
        }

        private async Task HandlePRAssignments(dynamic payload, CancellationToken cancellationToken)
        {
            IDictionary<string, object> entries = await Storage.ReadAsync(keys: new[] { "conversations" }, cancellationToken);

            if (entries.ContainsKey("conversations"))
            {
                List<ConversationInfo> convos = (List<ConversationInfo>)entries["conversations"];

                List<ConversationInfo> group_convos = convos.FindAll(x => x.IsGroup);

                Attachment attachment = GitHubCards.CreatePullRequestCard(payload);

                group_convos.ForEach(async convo =>
                {
                    if (string.IsNullOrEmpty(convo.TeamId))
                    {
                        ConversationReference conversationReference = new ConversationReference
                        {
                            Conversation = new ConversationAccount()
                            {
                                Name = "Github Webhook",
                                Id = convo.Id,
                                ConversationType = "personal",
                                IsGroup = true,

                            },
                            ServiceUrl = convo.ServiceUrl
                        };

                        await Adapter.ContinueConversationAsync(convo.BotId, conversationReference, async (turnContext, token) =>
                        {
                            await turnContext.SendActivityAsync(MessageFactory.Attachment(attachment), cancellationToken: token);
                        }, cancellationToken);
                    }
                    else
                    {
                        var parameters = new ConversationParameters
                        {
                            IsGroup = true,
                            ChannelData = new TeamsChannelData
                            {
                                Channel = new ChannelInfo
                                {
                                    Id = convo.ChannelId
                                },
                                Team = new TeamInfo
                                {
                                    Id = convo.TeamId
                                }
                            },
                            Activity = (Activity)MessageFactory.Attachment(attachment)
                        };
                        await Adapter.CreateConversationAsync(
                            convo.BotId,
                            convo.ChannelId,
                            convo.ServiceUrl,
                            null,
                            parameters,
                            (turnContext, token) =>
                            {
                                return Task.CompletedTask;
                            },
                            cancellationToken);
                    }
                });
            }
        }

        private async Task HandlePRStatusChanges(dynamic payload, CancellationToken cancellationToken)
        {
            IDictionary<string, object> entries = await Storage.ReadAsync(keys: new[] { "conversations" }, cancellationToken);

            if (entries.ContainsKey("conversations"))
            {
                List<ConversationInfo> convos = (List<ConversationInfo>)entries["conversations"];

                List<ConversationInfo> group_convos = convos.FindAll(x => x.IsGroup);

                Attachment attachment = GitHubCards.CreatePullRequestStateCard(payload);

                group_convos.ForEach(async convo =>
                {
                    if (string.IsNullOrEmpty(convo.TeamId))
                    {
                        ConversationReference conversationReference = new ConversationReference
                        {
                            Conversation = new ConversationAccount()
                            {
                                Name = "Github Webhook",
                                Id = convo.Id,
                                ConversationType = "personal",
                                IsGroup = true,

                            },
                            ServiceUrl = convo.ServiceUrl
                        };

                        await Adapter.ContinueConversationAsync(convo.BotId, conversationReference, async (turnContext, token) =>
                        {
                            await turnContext.SendActivityAsync(MessageFactory.Attachment(attachment), cancellationToken: token);
                        }, cancellationToken);
                    }
                    else
                    {
                        var parameters = new ConversationParameters
                        {
                            IsGroup = true,
                            ChannelData = new TeamsChannelData
                            {
                                Channel = new ChannelInfo
                                {
                                    Id = convo.ChannelId
                                },
                                Team = new TeamInfo
                                {
                                    Id = convo.TeamId
                                }
                            },
                            Activity = (Activity)MessageFactory.Attachment(attachment)
                        };
                        await Adapter.CreateConversationAsync(
                            convo.BotId,
                            convo.ChannelId,
                            convo.ServiceUrl,
                            null,
                            parameters,
                            (turnContext, token) =>
                            {
                                return Task.CompletedTask;
                            },
                            cancellationToken);
                    }

                });

            }
        }
    }
}
