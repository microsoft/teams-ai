using AdaptiveCards;
using Microsoft.Bot.Builder;
using Microsoft.Bot.Schema.Teams;
using Microsoft.Bot.Schema;
using Newtonsoft.Json.Linq;
using OSSDevOpsAgent.Templates;
using Microsoft.Teams.AI;

namespace OSSDevOpsAgent
{
    /// <summary>
    /// Handles GitHub webhooks and events.
    /// </summary>
    public class GHService : IRepositoryService
    {
        public GHService(MemoryStorage storage, TeamsAdapter adapter, IRepositoryPlugin plugin) : base()
        {
            Storage = storage;
            Adapter = adapter;
            RepositoryPlugin = plugin;
        }

        public override async Task HandleWebhook(dynamic payload, CancellationToken cancellationToken, HttpRequest request, HttpResponse response)
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

                Attachment attachment = CreatePullRequestCard(payload);

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

                Attachment attachment = CreatePullRequestStateCard(payload);

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

        private static Attachment CreatePullRequestCard(JObject payload)
        {
            var pullRequest = payload["pull_request"];
            string assignee = pullRequest["assignee"] != null ? pullRequest["assignee"]["login"].ToString() : "Unknown User";
            string prTitle = pullRequest["title"].ToString();
            string prUrl = pullRequest["html_url"].ToString();
            int prNumber = pullRequest["number"].Value<int>();

            var card = new AdaptiveCard(new AdaptiveSchemaVersion(1, 2))
            {
                Body = new List<AdaptiveElement>
                {
                    new AdaptiveTextBlock
                    {
                        Text = $"✎ Assignee Requested for Pull Request #{prNumber} ✎",
                        Weight = AdaptiveTextWeight.Bolder,
                        Size = AdaptiveTextSize.Medium,
                        Color = AdaptiveTextColor.Accent
                    },
                    new AdaptiveTextBlock
                    {
                        Text = $"{prTitle}",
                        Wrap = true,
                        Size = AdaptiveTextSize.Medium,
                        Weight = AdaptiveTextWeight.Bolder
                    },
                    new AdaptiveTextBlock
                    {
                        Text = $"{assignee} has been assigned to review this pull request.",
                        Wrap = true,
                        Size = AdaptiveTextSize.Medium,
                        Spacing = AdaptiveSpacing.Medium
                    }
                },
                Actions = new List<AdaptiveAction>
                {
                    new AdaptiveOpenUrlAction
                    {
                        Title = "View on GitHub",
                        Url = new Uri(prUrl)
                    }
                }
            };

            return new Attachment
            {
                ContentType = AdaptiveCard.ContentType,
                Content = card
            };
        }

        private static Attachment CreatePullRequestStateCard(JObject payload)
        {
            var pullRequest = payload["pull_request"];
            string action = payload["action"].ToString();
            string prTitle = pullRequest["title"].ToString();
            string prUrl = pullRequest["html_url"].ToString();
            int prNumber = pullRequest["number"].Value<int>();

            var card = new AdaptiveCard(new AdaptiveSchemaVersion(1, 2))
            {
                Body = new List<AdaptiveElement>
                {
                    new AdaptiveTextBlock
                    {
                        Text = $"🔔 Status Update for Pull Request #{prNumber} 🔔",
                        Weight = AdaptiveTextWeight.Bolder,
                        Size = AdaptiveTextSize.Medium,
                        Color = AdaptiveTextColor.Accent
                    },
                    new AdaptiveTextBlock
                    {
                        Text = $"{prTitle}",
                        Wrap = true,
                        Size = AdaptiveTextSize.Medium,
                        Weight = AdaptiveTextWeight.Bolder
                    },
                    new AdaptiveTextBlock
                    {
                        Text = $"PR is now {action}",
                        Wrap = true,
                        Size = AdaptiveTextSize.Medium,
                        Spacing = AdaptiveSpacing.Medium
                    }
                },
                Actions = new List<AdaptiveAction>
                {
                    new AdaptiveOpenUrlAction
                    {
                        Title = "View on GitHub",
                        Url = new Uri(prUrl)
                    }
                }
            };

            return new Attachment
            {
                ContentType = AdaptiveCard.ContentType,
                Content = card
            };
        }
    }
}
