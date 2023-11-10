using GPT.Model;
using Microsoft.Bot.Builder;
using Microsoft.Bot.Schema;
using Microsoft.Bot.Schema.Teams;
using Microsoft.Teams.AI;
using Microsoft.Teams.AI.Exceptions;
using Microsoft.Teams.AI.State;
using Newtonsoft.Json.Linq;
using System.Net;

namespace GPT
{
    /// <summary>
    /// Defines the activity handlers.
    /// </summary>
    public class ActivityHandlers
    {
        private readonly Application<TurnState, TurnStateManager> _app;
        private readonly bool _previewMode;

        public ActivityHandlers(Application<TurnState, TurnStateManager> app, bool previewMode = false)
        {
            _app = app;
            _previewMode = previewMode;
        }

        /// <summary>
        /// Handles Message Extension fetchTask events.
        /// </summary>
        public FetchTaskHandler<TurnState> FetchTaskHandler => async (ITurnContext turnContext, TurnState turnState, CancellationToken cancellationToken) =>
        {
            // Return card as a TaskInfo object
            Attachment card = await CardBuilder.NewInitialViewAttachment(cancellationToken);
            return new TaskModuleResponse
            {
                Task = CreateTaskModule(card)
            };
        };

        /// <summary>
        /// Handles Message Extension submitAction events.
        /// </summary>
        public SubmitActionHandler<TurnState> SubmitActionHandler => async (ITurnContext turnContext, TurnState turnState, object data, CancellationToken cancellationToken) =>
        {
            SubmitData submitData = (data as JObject)?.ToObject<SubmitData>() ?? throw new Exception("Incorrect submit data format"); ;
            switch (submitData.Verb)
            {
                case "generate":
                {
                    // Call GPT and return response view
                    string post = await GetGPTPost(turnContext, turnState, "Generate", submitData, cancellationToken);
                    Attachment card = await CardBuilder.NewEditViewAttachment(post, _previewMode, cancellationToken);
                    return new MessagingExtensionActionResponse
                    {
                        Task = CreateTaskModule(card)
                    };
                }
                case "update":
                {
                    // Call GPT and return an updated response view
                    string post = await GetGPTPost(turnContext, turnState, "Update", submitData, cancellationToken);
                    Attachment card = await CardBuilder.NewEditViewAttachment(post, _previewMode, cancellationToken);
                    return new MessagingExtensionActionResponse
                    {
                        Task = CreateTaskModule(card)
                    };
                }
                case "preview":
                {
                    // Preview the post as an adaptive card
                    Attachment card = await CardBuilder.NewPostCardAttachment(submitData.Post ?? string.Empty, cancellationToken);
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
                    Attachment card = await CardBuilder.NewPostCardAttachment(submitData.Post ?? string.Empty, cancellationToken);
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
                    throw new Exception($"Unknown CreatePost verb: {submitData.Verb}");
            }
        };

        /// <summary>
        /// Handles Message Extension botMessagePreview edit events.
        /// </summary>
        public BotMessagePreviewEditHandler<TurnState> BotMessagePreviewEditHandler => async (ITurnContext turnContext, TurnState turnState, Activity activityPreview, CancellationToken cancellationToken) =>
        {
            // Get post text from previewed card
            PreviewCard previewCard =
                (activityPreview?.Attachments.FirstOrDefault()?.Content as JObject)?
                .ToObject<PreviewCard>()
                ?? throw new Exception("Incorrect preview card format");
            string post = previewCard.Body?.FirstOrDefault()?.Text ?? string.Empty;
            Attachment editCard = await CardBuilder.NewEditViewAttachment(post, _previewMode, cancellationToken);
            return new MessagingExtensionActionResponse
            {
                Task = CreateTaskModule(editCard)
            };
        };

        /// <summary>
        /// Handles Message Extension botMessagePreview send events.
        /// </summary>
        public BotMessagePreviewSendHandler<TurnState> BotMessagePreviewSendHandler => async (ITurnContext turnContext, TurnState turnState, Activity activityPreview, CancellationToken cancellationToken) =>
        {
            // Create a new activity using the card in the preview activity
            Attachment card = activityPreview?.Attachments.FirstOrDefault() ?? throw new Exception("No card found in preview activity");
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
        };

        private async Task<string> GetGPTPost(ITurnContext turnContext, TurnState turnState, string prompt, SubmitData data, CancellationToken cancellationToken)
        {
            // Set prompt variables
            _app.AI.Prompts.Variables.Add("prompt", data.Prompt ?? string.Empty);
            _app.AI.Prompts.Variables.Add("post", data.Post ?? string.Empty);

            try
            {
                return await _app.AI.CompletePromptAsync(turnContext, turnState, prompt, null, cancellationToken);
            }
            catch (HttpOperationException e) when (e.StatusCode == HttpStatusCode.TooManyRequests)
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
