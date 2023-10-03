using GPT.Model;
using Microsoft.Bot.Builder;
using Microsoft.Bot.Schema;
using Microsoft.Bot.Schema.Teams;
using Microsoft.Rest;
using Microsoft.TeamsAI;
using Microsoft.TeamsAI.State;
using Newtonsoft.Json.Linq;
using System.Net;

namespace GPT
{
    public class GPTMessageExtension : Application<TurnState, TurnStateManager>
    {
        private readonly bool _previewMode;

        public GPTMessageExtension(ApplicationOptions<TurnState, TurnStateManager> options, bool previewMode = false) : base(options)
        {
            _previewMode = previewMode;
        }

        protected override async Task<MessagingExtensionActionResponse> OnMessagingExtensionFetchTaskAsync(MessagingExtensionAction action, ITurnContext<IInvokeActivity> turnContext, TurnState turnState, CancellationToken cancellationToken)
        {
            string command = action.CommandId;
            if (string.Equals("CreatePost", command, StringComparison.OrdinalIgnoreCase))
            {
                // Return card as a TaskInfo object
                Attachment card = await CardBuilder.NewInitialViewAttachment(cancellationToken);
                return new MessagingExtensionActionResponse
                {
                    Task = CreateTaskModule(card)
                };
            }
            else
            {
                throw new Exception($"Unknown message extension fetch command: {command}");
            }
        }

        protected override async Task<MessagingExtensionActionResponse> OnMessagingExtensionSubmitActionAsync(MessagingExtensionAction action, ITurnContext<IInvokeActivity> turnContext, TurnState turnState, CancellationToken cancellationToken)
        {
            string command = action.CommandId;
            if (string.Equals("CreatePost", command, StringComparison.OrdinalIgnoreCase))
            {
                SubmitData? data = (action.Data as JObject)?.ToObject<SubmitData>() ?? throw new Exception("Incorrect submit data format");
                switch (data.Verb?.ToLowerInvariant())
                {
                    case "generate":
                    {
                        // Call GPT and return response view
                        string post = await GetGPTPost(turnContext, turnState, "Generate", data, cancellationToken);
                        Attachment card = await CardBuilder.NewEditViewAttachment(post, _previewMode, cancellationToken);
                        return new MessagingExtensionActionResponse
                        {
                            Task = CreateTaskModule(card)
                        };
                    }
                    case "update":
                    {
                        // Call GPT and return an updated response view
                        string post = await GetGPTPost(turnContext, turnState, "Update", data, cancellationToken);
                        Attachment card = await CardBuilder.NewEditViewAttachment(post, _previewMode, cancellationToken);
                        return new MessagingExtensionActionResponse
                        {
                            Task = CreateTaskModule(card)
                        };
                    }
                    case "preview":
                    {
                        // Preview the post as an adaptive card
                        Attachment card = await CardBuilder.NewPostCardAttachment(data.Post ?? string.Empty, cancellationToken);
                        return new MessagingExtensionActionResponse
                        {
                            ComposeExtension = new MessagingExtensionResult
                            {
                                Type = "botMessagePreview",
                                ActivityPreview = MessageFactory.Attachment(card) as Activity,
                            }
                        };
                    }
                    case "post":
                    {
                        // Drop the card into compose window
                        Attachment card = await CardBuilder.NewPostCardAttachment(data.Post ?? string.Empty, cancellationToken);
                        return new MessagingExtensionActionResponse
                        {
                            ComposeExtension = new MessagingExtensionResult
                            {
                                Type = "result",
                                AttachmentLayout = "list",
                                Attachments = new List<MessagingExtensionAttachment>
                                    {
                                        card.ToMessagingExtensionAttachment()
                                    }
                            }
                        };
                    }
                    default:
                        throw new Exception($"Unknown CreatePost verb: {data.Verb}");
                }
            }
            else
            {
                throw new Exception($"Unknown message extension fetch command: {command}");
            }
        }

        protected override async Task<MessagingExtensionActionResponse> OnMessagingExtensionBotMessagePreviewEditAsync(MessagingExtensionAction action, ITurnContext<IInvokeActivity> turnContext, TurnState turnState, CancellationToken cancellationToken)
        {
            // Get post text from previewed card
            PreviewCard previewCard =
                (action.BotActivityPreview.FirstOrDefault()?.Attachments.FirstOrDefault()?.Content as JObject)?
                .ToObject<PreviewCard>()
                ?? throw new Exception("Incorrect preview card format");
            string post = previewCard.Body?.FirstOrDefault()?.Text ?? string.Empty;
            Attachment editCard = await CardBuilder.NewEditViewAttachment(post, _previewMode, cancellationToken);
            return new MessagingExtensionActionResponse
            {
                Task = CreateTaskModule(editCard)
            };
        }

        protected override async Task<MessagingExtensionActionResponse> OnMessagingExtensionBotMessagePreviewSendAsync(MessagingExtensionAction action, ITurnContext<IInvokeActivity> turnContext, TurnState turnState, CancellationToken cancellationToken)
        {
            // Create a new activity using the card in the preview activity
            Attachment card = action.BotActivityPreview.FirstOrDefault()?.Attachments.FirstOrDefault() ?? throw new Exception("No card found in preview activity");
            IActivity activity = MessageFactory.Attachment(card);

            // Set onBehalfOf in channel data
            activity.ChannelData = new Dictionary<string, object>
            {
                {
                    "onBehalfOf",
                    new List<OnBehalfOf>
                    {
                        new OnBehalfOf
                        {
                            ItemId = 0,
                            MentionType = "person",
                            Mri = turnContext.Activity.From.Id,
                            DisplayName = turnContext.Activity.From.Name
                        }
                    }
                }
            };

            await turnContext.SendActivityAsync(activity, cancellationToken);

            return new MessagingExtensionActionResponse();
        }

        protected override Task OnMessageActivityAsync(ITurnContext<IMessageActivity> turnContext, TurnState turnState, CancellationToken cancellationToken)
        {
            // Ignore message directly sent to the bot
            return Task.CompletedTask;
        }

        private async Task<string> GetGPTPost(ITurnContext turnContext, TurnState turnState, string prompt, SubmitData data, CancellationToken cancellationToken)
        {
            // Set prompt variables
            AI.Prompts.Variables.Add("prompt", data.Prompt ?? string.Empty);
            AI.Prompts.Variables.Add("post", data.Post ?? string.Empty);

            try
            {
                return await AI.CompletePromptAsync(turnContext, turnState, prompt, null, cancellationToken);
            }
            catch (HttpOperationException e) when (e.Response.StatusCode == HttpStatusCode.TooManyRequests)
            {
                throw new Exception("The request to OpenAI was rate limited. Please try again later.", e);
            }
        }

        private static TaskModuleContinueResponse CreateTaskModule(Attachment attachment)
        {
            return new TaskModuleContinueResponse
            {
                Value = new TaskModuleTaskInfo
                {
                    Title = "Create Post",
                    Card = attachment,
                    Height = "medium",
                    Width = "medium"
                }
            };
        }
    }
}
