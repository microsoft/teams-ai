using GPT.Model;
using Microsoft.Bot.Builder;
using Microsoft.Bot.Schema;
using Microsoft.Bot.Schema.Teams;
using Microsoft.Teams.AI;
using Microsoft.Teams.AI.AI.Planners;
using Microsoft.Teams.AI.AI.Prompts;
using Microsoft.Teams.AI.Exceptions;
using Newtonsoft.Json.Linq;
using System.Net;

namespace GPT
{
    /// <summary>
    /// Defines the activity handlers.
    /// </summary>
    public class ActivityHandlers
    {
        private readonly ActionPlanner<AppState> _planner;
        private readonly PromptManager _prompts;
        private readonly bool _previewMode;

        public ActivityHandlers(ActionPlanner<AppState> planner, PromptManager prompts, bool previewMode = false)
        {
            _planner = planner;
            _prompts = prompts;
            _previewMode = previewMode;
        }

        /// <summary>
        /// Handles Message Extension fetchTask events.
        /// </summary>
        public FetchTaskHandlerAsync<AppState> FetchTaskHandler => async (turnContext, turnState, cancellationToken) =>
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
        public SubmitActionHandlerAsync<AppState> SubmitActionHandler => async (turnContext, turnState, data, cancellationToken) =>
        {
            SubmitData submitData = (data as JObject)?.ToObject<SubmitData>() ?? throw new Exception("Incorrect submit data format"); ;
            switch (submitData.Verb)
            {
                case "generate":
                {
                    // Call GPT and return response view
                    string post = await UpdatePost(turnContext, turnState, "Generate", submitData, cancellationToken);
                    Attachment card = await CardBuilder.NewEditViewAttachment(post, _previewMode, cancellationToken);
                    return new MessagingExtensionActionResponse
                    {
                        Task = CreateTaskModule(card)
                    };
                }
                case "update":
                {
                    // Call GPT and return an updated response view
                    string post = await UpdatePost(turnContext, turnState, "Update", submitData, cancellationToken);
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
        public BotMessagePreviewEditHandlerAsync<AppState> BotMessagePreviewEditHandler => async (turnContext, turnState, activityPreview, cancellationToken) =>
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
        public BotMessagePreviewSendHandler<AppState> BotMessagePreviewSendHandler => async (turnContext, turnState, activityPreview, cancellationToken) =>
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

        private async Task<string> UpdatePost(ITurnContext context, AppState state, string prompt, SubmitData data, CancellationToken cancellationToken)
        {
            state.Temp.Post = data.Post ?? string.Empty;
            state.Temp.Prompt = data.Prompt ?? string.Empty;

            try
            {
                var res = await _planner.CompletePromptAsync(context, state, _prompts.GetPrompt(prompt), null, cancellationToken);

                if (res?.Status != PromptResponseStatus.Success)
                {
                    throw new Exception($"The LLM request had the following error: {res?.Error?.Message}");
                }

                return res?.Message?.GetContent<string>() ?? string.Empty;
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
