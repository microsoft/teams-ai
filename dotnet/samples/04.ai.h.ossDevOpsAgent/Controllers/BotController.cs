using AdaptiveCards;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Bot.Builder;
using Microsoft.Bot.Builder.Integration.AspNet.Core;
using Microsoft.Bot.Schema;
using Microsoft.Teams.AI;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace OSSDevOpsAgent.Controllers
{
    [Route("api/messages")]
    [ApiController]
    public class BotController : ControllerBase
    {
        private readonly IBotFrameworkHttpAdapter _adapter;
        private readonly IBot _bot;

        public BotController(IBotFrameworkHttpAdapter adapter, IBot bot)
        {
            _adapter = adapter;
            _bot = bot;
        }

        [HttpPost]
        public async Task PostAsync(CancellationToken cancellationToken = default)
        {
            await _adapter.ProcessAsync
            (
                Request,
                Response,
                _bot,
                cancellationToken
            );
        }
    }

    [Route("api/webhook")]
    [ApiController]
    public class WebhookController : ControllerBase
    {
        private readonly TeamsAdapter _adapter;
        private readonly IBot _bot;
        private readonly MemoryStorage _storage;

        public WebhookController(TeamsAdapter adapter, IStorage storage)
        {
            _adapter = adapter;
            _storage = storage as MemoryStorage;
        }

        [HttpPost]
        public async Task PostAsync(CancellationToken cancellationToken = default)
        {
            string requestBody;
            using (var reader = new StreamReader(Request.Body))
            {
                requestBody = await reader.ReadToEndAsync();
            }

            var payload = JsonConvert.DeserializeObject<dynamic>(requestBody);
            var eventType = Request.Headers["x-github-event"].ToString();

            var labels = new List<string>() { "closed", "opened", "reopened", "ready_for_review" };

            // Handle pull request assignment events
            if (eventType == "pull_request" && (payload.action == "assigned"))
            {
                await HandlePullRequestAssignments(payload, cancellationToken);
            } // Handle pull request state changes
            else if (eventType == "pull_request" && (labels.Contains(payload.action.ToString())))
            {
                await HandlePullRequestStateChanges(payload, cancellationToken);
            }

            Response.StatusCode = 200;
            await Response.WriteAsync("Event received", cancellationToken);
        }

        private async Task HandlePullRequestAssignments(dynamic payload, CancellationToken cancellationToken)
        {
            IDictionary<string, object> entries = await _storage.ReadAsync(keys: new[] { "conversations" }, cancellationToken);

            if (entries.ContainsKey("conversations"))
            {
                List<ConversationInfo> convos = (List<ConversationInfo>)entries["conversations"];

                List<ConversationInfo> group_convos = convos.FindAll(x => x.IsGroup);

                group_convos.ForEach(async convo =>
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

                    await _adapter.ContinueConversationAsync(convo.BotId, conversationReference, async (turnContext, token) =>
                    {
                        Attachment attachment = CreatePullRequestCard(payload);
                        await turnContext.SendActivityAsync(MessageFactory.Attachment(attachment), cancellationToken: token);
                    }, cancellationToken);

                });

            }
        }

        private async Task HandlePullRequestStateChanges(dynamic payload, CancellationToken cancellationToken)
        {
            IDictionary<string, object> entries = await _storage.ReadAsync(keys: new[] { "conversations" }, cancellationToken);

            if (entries.ContainsKey("conversations"))
            {
                List<ConversationInfo> convos = (List<ConversationInfo>)entries["conversations"];

                List<ConversationInfo> group_convos = convos.FindAll(x => x.IsGroup);

                group_convos.ForEach(async convo =>
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

                    await _adapter.ContinueConversationAsync(convo.BotId, conversationReference, async (turnContext, token) =>
                    {
                        Attachment attachment = CreatePullRequestStateCard(payload);
                        await turnContext.SendActivityAsync(MessageFactory.Attachment(attachment), cancellationToken: token);
                    }, cancellationToken);

                });

            }
        }

        private static Attachment CreateAdaptiveCardAttachment(string filePath)
        {
            var adaptiveCardJson = System.IO.File.ReadAllText(filePath);
            var adaptiveCardAttachment = new Attachment()
            {
                ContentType = "application/vnd.microsoft.card.adaptive",
                Content = JsonConvert.DeserializeObject(adaptiveCardJson),
            };
            return adaptiveCardAttachment;
        }

        public Attachment CreatePullRequestCard(JObject payload)
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
                        Text = $"🔔 Assignee Update for Pull Request #{prNumber} 🔔",
                        Weight = AdaptiveTextWeight.Bolder,
                        Size = AdaptiveTextSize.Medium,
                        Color = AdaptiveTextColor.Accent
                    },
                    new AdaptiveTextBlock
                    {
                        Text = $"**Title:** {prTitle}",
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

        public Attachment CreatePullRequestStateCard(JObject payload)
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
                        Text = $"🔔 State Update for Pull Request #{prNumber} 🔔",
                        Weight = AdaptiveTextWeight.Bolder,
                        Size = AdaptiveTextSize.Medium,
                        Color = AdaptiveTextColor.Accent
                    },
                    new AdaptiveTextBlock
                    {
                        Text = $"**Title:** {prTitle}",
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
