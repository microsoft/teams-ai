using Microsoft.Bot.Schema;
using Microsoft.Bot.Schema.Teams;
using Newtonsoft.Json.Linq;
using System.Reflection;

namespace Microsoft.Bot.Builder.M365.Tests.TestUtils
{
    internal class TestActivityHandler : Application<TurnState>
    {
        public TestActivityHandler(ApplicationOptions<TurnState> options) : base(options)
        {
        }

        public List<string> Record { get; } = new List<string>();

        protected override Task OnMessageActivityAsync(ITurnContext<IMessageActivity> turnContext, TurnState turnState, CancellationToken cancellationToken)
        {
            Record.Add(MethodBase.GetCurrentMethod().Name);
            return Task.CompletedTask;
        }

        protected override Task OnMessageUpdateActivityAsync(ITurnContext<IMessageUpdateActivity> turnContext, TurnState turnState, CancellationToken cancellationToken)
        {
            Record.Add(MethodBase.GetCurrentMethod().Name);
            return base.OnMessageUpdateActivityAsync(turnContext, turnState, cancellationToken);
        }

        protected override Task OnMessageDeleteActivityAsync(ITurnContext<IMessageDeleteActivity> turnContext, TurnState turnState, CancellationToken cancellationToken)
        {
            Record.Add(MethodBase.GetCurrentMethod().Name);
            return base.OnMessageDeleteActivityAsync(turnContext, turnState, cancellationToken);
        }

        protected override Task OnConversationUpdateActivityAsync(ITurnContext<IConversationUpdateActivity> turnContext, TurnState turnState, CancellationToken cancellationToken)
        {
            Record.Add(MethodBase.GetCurrentMethod().Name);
            return base.OnConversationUpdateActivityAsync(turnContext, turnState, cancellationToken);
        }

        protected override Task OnMembersAddedAsync(IList<ChannelAccount> membersAdded, ITurnContext<IConversationUpdateActivity> turnContext, TurnState turnState, CancellationToken cancellationToken)
        {
            Record.Add(MethodBase.GetCurrentMethod().Name);
            return Task.CompletedTask;
        }

        protected override Task OnMembersRemovedAsync(IList<ChannelAccount> membersRemoved, ITurnContext<IConversationUpdateActivity> turnContext, TurnState turnState, CancellationToken cancellationToken)
        {
            Record.Add(MethodBase.GetCurrentMethod().Name);
            return Task.CompletedTask;
        }

        protected override Task OnMessageReactionActivityAsync(ITurnContext<IMessageReactionActivity> turnContext, TurnState turnState, CancellationToken cancellationToken)
        {
            Record.Add(MethodBase.GetCurrentMethod().Name);
            return base.OnMessageReactionActivityAsync(turnContext, turnState, cancellationToken);
        }

        protected override Task OnReactionsAddedAsync(IList<MessageReaction> messageReactions, ITurnContext<IMessageReactionActivity> turnContext, TurnState turnState, CancellationToken cancellationToken)
        {
            Record.Add(MethodBase.GetCurrentMethod().Name);
            return Task.CompletedTask;
        }

        protected override Task OnReactionsRemovedAsync(IList<MessageReaction> messageReactions, ITurnContext<IMessageReactionActivity> turnContext, TurnState turnState, CancellationToken cancellationToken)
        {
            Record.Add(MethodBase.GetCurrentMethod().Name);
            return Task.CompletedTask;
        }

        protected override Task OnEventActivityAsync(ITurnContext<IEventActivity> turnContext, TurnState turnState, CancellationToken cancellationToken)
        {
            Record.Add(MethodBase.GetCurrentMethod().Name);
            return base.OnEventActivityAsync(turnContext, turnState, cancellationToken);
        }

        protected override Task OnTokenResponseEventAsync(ITurnContext<IEventActivity> turnContext, TurnState turnState, CancellationToken cancellationToken)
        {
            Record.Add(MethodBase.GetCurrentMethod().Name);
            return Task.CompletedTask;
        }

        protected override Task OnEventAsync(ITurnContext<IEventActivity> turnContext, TurnState turnState, CancellationToken cancellationToken)
        {
            Record.Add(MethodBase.GetCurrentMethod().Name);
            return Task.CompletedTask;
        }

        protected override Task OnEndOfConversationActivityAsync(ITurnContext<IEndOfConversationActivity> turnContext, TurnState turnState, CancellationToken cancellationToken)
        {
            Record.Add(MethodBase.GetCurrentMethod().Name);
            return Task.CompletedTask;
        }

        protected override Task OnTypingActivityAsync(ITurnContext<ITypingActivity> turnContext, TurnState turnState, CancellationToken cancellationToken)
        {
            Record.Add(MethodBase.GetCurrentMethod().Name);
            return Task.CompletedTask;
        }

        protected override Task OnInstallationUpdateActivityAsync(ITurnContext<IInstallationUpdateActivity> turnContext, TurnState turnState, CancellationToken cancellationToken)
        {
            Record.Add(MethodBase.GetCurrentMethod().Name);
            return base.OnInstallationUpdateActivityAsync(turnContext, turnState, cancellationToken);
        }

        protected override Task OnCommandActivityAsync(ITurnContext<ICommandActivity> turnContext, TurnState turnState, CancellationToken cancellationToken)
        {
            Record.Add(MethodBase.GetCurrentMethod().Name);
            return Task.CompletedTask;
        }

        protected override Task OnCommandResultActivityAsync(ITurnContext<ICommandResultActivity> turnContext, TurnState turnState, CancellationToken cancellationToken)
        {
            Record.Add(MethodBase.GetCurrentMethod().Name);
            return Task.CompletedTask;
        }

        protected override Task OnUnrecognizedActivityTypeAsync(ITurnContext turnContext, TurnState turnState, CancellationToken cancellationToken)
        {
            Record.Add(MethodBase.GetCurrentMethod().Name);
            return Task.CompletedTask;
        }

        protected override Task<InvokeResponse> OnInvokeActivityAsync(ITurnContext<IInvokeActivity> turnContext, TurnState turnState, CancellationToken cancellationToken)
        {
            Record.Add(MethodBase.GetCurrentMethod().Name);
            if (turnContext.Activity.Name == "some.random.invoke")
            {
                return Task.FromResult(CreateInvokeResponse(null));
            }

            return base.OnInvokeActivityAsync(turnContext, turnState, cancellationToken);
        }

        protected override Task OnSignInInvokeAsync(ITurnContext<IInvokeActivity> turnContext, TurnState turnState, CancellationToken cancellationToken)
        {
            Record.Add(MethodBase.GetCurrentMethod().Name);
            return base.OnSignInInvokeAsync(turnContext, turnState, cancellationToken);
        }

        protected override Task OnInstallationUpdateAddAsync(ITurnContext<IInstallationUpdateActivity> turnContext, TurnState turnState, CancellationToken cancellationToken)
        {
            Record.Add(MethodBase.GetCurrentMethod().Name);
            return Task.CompletedTask;
        }

        protected override Task OnInstallationUpdateRemoveAsync(ITurnContext<IInstallationUpdateActivity> turnContext, TurnState turnState, CancellationToken cancellationToken)
        {
            Record.Add(MethodBase.GetCurrentMethod().Name);
            return Task.CompletedTask;
        }

        protected override Task<AdaptiveCardInvokeResponse> OnAdaptiveCardActionExecuteAsync(AdaptiveCardInvokeValue invokeValue, ITurnContext<IInvokeActivity> turnContext, TurnState turnState, CancellationToken cancellationToken)
        {
            Record.Add(MethodBase.GetCurrentMethod().Name);
            return Task.FromResult(new AdaptiveCardInvokeResponse());
        }

        protected override Task<SearchInvokeResponse> OnSearchInvokeAsync(SearchInvokeValue invokeValue, ITurnContext<IInvokeActivity> turnContext, TurnState turnState, CancellationToken cancellationToken)
        {
            Record.Add(MethodBase.GetCurrentMethod().Name);
            return Task.FromResult(new SearchInvokeResponse());
        }

        protected override Task OnChannelCreatedAsync(ChannelInfo channelInfo, TeamInfo teamInfo, ITurnContext<IConversationUpdateActivity> turnContext, TurnState turnState, CancellationToken cancellationToken)
        {
            Record.Add(MethodBase.GetCurrentMethod().Name);
            return base.OnChannelCreatedAsync(channelInfo, teamInfo, turnContext, turnState, cancellationToken);
        }

        protected override Task OnChannelDeletedAsync(ChannelInfo channelInfo, TeamInfo teamInfo, ITurnContext<IConversationUpdateActivity> turnContext, TurnState turnState, CancellationToken cancellationToken)
        {
            Record.Add(MethodBase.GetCurrentMethod().Name);
            return base.OnChannelDeletedAsync(channelInfo, teamInfo, turnContext, turnState, cancellationToken);
        }

        protected override Task OnChannelRenamedAsync(ChannelInfo channelInfo, TeamInfo teamInfo, ITurnContext<IConversationUpdateActivity> turnContext, TurnState turnState, CancellationToken cancellationToken)
        {
            Record.Add(MethodBase.GetCurrentMethod().Name);
            return base.OnChannelRenamedAsync(channelInfo, teamInfo, turnContext, turnState, cancellationToken);
        }

        protected override Task OnChannelRestoredAsync(ChannelInfo channelInfo, TeamInfo teamInfo, ITurnContext<IConversationUpdateActivity> turnContext, TurnState turnState, CancellationToken cancellationToken)
        {
            Record.Add(MethodBase.GetCurrentMethod().Name);
            return base.OnChannelRestoredAsync(channelInfo, teamInfo, turnContext, turnState, cancellationToken);
        }

        protected override Task OnTeamArchivedAsync(TeamInfo teamInfo, ITurnContext<IConversationUpdateActivity> turnContext, TurnState turnState, CancellationToken cancellationToken)
        {
            Record.Add(MethodBase.GetCurrentMethod().Name);
            return base.OnTeamArchivedAsync(teamInfo, turnContext, turnState, cancellationToken);
        }

        protected override Task OnTeamDeletedAsync(TeamInfo teamInfo, ITurnContext<IConversationUpdateActivity> turnContext, TurnState turnState, CancellationToken cancellationToken)
        {
            Record.Add(MethodBase.GetCurrentMethod().Name);
            return base.OnTeamDeletedAsync(teamInfo, turnContext, turnState, cancellationToken);
        }

        protected override Task OnTeamHardDeletedAsync(TeamInfo teamInfo, ITurnContext<IConversationUpdateActivity> turnContext, TurnState turnState, CancellationToken cancellationToken)
        {
            Record.Add(MethodBase.GetCurrentMethod().Name);
            return base.OnTeamHardDeletedAsync(teamInfo, turnContext, turnState, cancellationToken);
        }

        protected override Task OnTeamRenamedAsync(TeamInfo teamInfo, ITurnContext<IConversationUpdateActivity> turnContext, TurnState turnState, CancellationToken cancellationToken)
        {
            Record.Add(MethodBase.GetCurrentMethod().Name);
            return base.OnTeamRenamedAsync(teamInfo, turnContext, turnState, cancellationToken);
        }

        protected override Task OnTeamRestoredAsync(TeamInfo teamInfo, ITurnContext<IConversationUpdateActivity> turnContext, TurnState turnState, CancellationToken cancellationToken)
        {
            Record.Add(MethodBase.GetCurrentMethod().Name);
            return base.OnTeamRestoredAsync(teamInfo, turnContext, turnState, cancellationToken);
        }

        protected override Task OnTeamUnarchivedAsync(TeamInfo teamInfo, ITurnContext<IConversationUpdateActivity> turnContext, TurnState turnState, CancellationToken cancellationToken)
        {
            Record.Add(MethodBase.GetCurrentMethod().Name);
            return base.OnTeamUnarchivedAsync(teamInfo, turnContext, turnState, cancellationToken);
        }

        protected override Task OnMembersAddedAsync(IList<TeamsChannelAccount> membersAdded, TeamInfo teamInfo, ITurnContext<IConversationUpdateActivity> turnContext, TurnState turnState, CancellationToken cancellationToken)
        {
            Record.Add(MethodBase.GetCurrentMethod().Name);
            return Task.CompletedTask;
        }

        protected override Task OnMembersRemovedAsync(IList<TeamsChannelAccount> membersRemoved, TeamInfo teamInfo, ITurnContext<IConversationUpdateActivity> turnContext, TurnState turnState, CancellationToken cancellationToken)
        {
            Record.Add(MethodBase.GetCurrentMethod().Name);
            return Task.CompletedTask;
        }

        protected override Task OnReadReceiptAsync(ReadReceiptInfo readReceiptInfo, ITurnContext<IEventActivity> turnContext, TurnState turnState, CancellationToken cancellationToken)
        {
            Record.Add(MethodBase.GetCurrentMethod().Name);
            turnContext.SendActivityAsync(readReceiptInfo.LastReadMessageId);
            return Task.CompletedTask;
        }

        protected override Task<InvokeResponse> OnFileConsentAsync(FileConsentCardResponse fileConsentCardResponse, ITurnContext<IInvokeActivity> turnContext, TurnState turnState, CancellationToken cancellationToken)
        {
            Record.Add(MethodBase.GetCurrentMethod().Name);
            return base.OnFileConsentAsync(fileConsentCardResponse, turnContext, turnState, cancellationToken);
        }

        protected override Task OnFileConsentAcceptAsync(FileConsentCardResponse fileConsentCardResponse, ITurnContext<IInvokeActivity> turnContext, TurnState turnState, CancellationToken cancellationToken)
        {
            Record.Add(MethodBase.GetCurrentMethod().Name);
            return Task.CompletedTask;
        }

        protected override Task OnFileConsentDeclineAsync(FileConsentCardResponse fileConsentCardResponse, ITurnContext<IInvokeActivity> turnContext, TurnState turnState, CancellationToken cancellationToken)
        {
            Record.Add(MethodBase.GetCurrentMethod().Name);
            return Task.CompletedTask;
        }

        protected override Task OnO365ConnectorCardActionAsync(O365ConnectorCardActionQuery query, ITurnContext<IInvokeActivity> turnContext, TurnState turnState, CancellationToken cancellationToken)
        {
            Record.Add(MethodBase.GetCurrentMethod().Name);
            return Task.CompletedTask;
        }

        protected override Task<MessagingExtensionActionResponse> OnMessagingExtensionBotMessagePreviewEditAsync(MessagingExtensionAction action, ITurnContext<IInvokeActivity> turnContext, TurnState turnState, CancellationToken cancellationToken)
        {
            Record.Add(MethodBase.GetCurrentMethod().Name);
            return Task.FromResult(new MessagingExtensionActionResponse());
        }

        protected override Task<MessagingExtensionActionResponse> OnMessagingExtensionBotMessagePreviewSendAsync(MessagingExtensionAction action, ITurnContext<IInvokeActivity> turnContext, TurnState turnState, CancellationToken cancellationToken)
        {
            Record.Add(MethodBase.GetCurrentMethod().Name);
            return Task.FromResult(new MessagingExtensionActionResponse());
        }

        protected override Task OnMessagingExtensionCardButtonClickedAsync(JObject obj, ITurnContext<IInvokeActivity> turnContext, TurnState turnState, CancellationToken cancellationToken)
        {
            Record.Add(MethodBase.GetCurrentMethod().Name);
            return base.OnMessagingExtensionCardButtonClickedAsync(obj, turnContext, turnState, cancellationToken);
        }

        protected override Task<MessagingExtensionActionResponse> OnMessagingExtensionFetchTaskAsync(MessagingExtensionAction action, ITurnContext<IInvokeActivity> turnContext, TurnState turnState, CancellationToken cancellationToken)
        {
            Record.Add(MethodBase.GetCurrentMethod().Name);
            return Task.FromResult(new MessagingExtensionActionResponse());
        }

        protected override Task<MessagingExtensionResponse> OnMessagingExtensionConfigurationQuerySettingUrlAsync(MessagingExtensionQuery query, ITurnContext<IInvokeActivity> turnContext, TurnState turnState, CancellationToken cancellationToken)
        {
            Record.Add(MethodBase.GetCurrentMethod().Name);
            return Task.FromResult(new MessagingExtensionResponse());
        }

        protected override Task OnMessagingExtensionConfigurationSettingAsync(JObject obj, ITurnContext<IInvokeActivity> turnContext, TurnState turnState, CancellationToken cancellationToken)
        {
            Record.Add(MethodBase.GetCurrentMethod().Name);
            return Task.CompletedTask;
        }

        protected override Task<MessagingExtensionResponse> OnMessagingExtensionQueryAsync(MessagingExtensionQuery query, ITurnContext<IInvokeActivity> turnContext, TurnState turnState, CancellationToken cancellationToken)
        {
            Record.Add(MethodBase.GetCurrentMethod().Name);
            return Task.FromResult(new MessagingExtensionResponse());
        }

        protected override Task<MessagingExtensionResponse> OnMessagingExtensionSelectItemAsync(JObject query, ITurnContext<IInvokeActivity> turnContext, TurnState turnState, CancellationToken cancellationToken)
        {
            Record.Add(MethodBase.GetCurrentMethod().Name);
            return Task.FromResult(new MessagingExtensionResponse());
        }

        protected override Task<MessagingExtensionActionResponse> OnMessagingExtensionSubmitActionAsync(MessagingExtensionAction action, ITurnContext<IInvokeActivity> turnContext, TurnState turnState, CancellationToken cancellationToken)
        {
            Record.Add(MethodBase.GetCurrentMethod().Name);
            return Task.FromResult(new MessagingExtensionActionResponse());
        }

        protected override Task<MessagingExtensionActionResponse> OnMessagingExtensionSubmitActionDispatchAsync(MessagingExtensionAction action, ITurnContext<IInvokeActivity> turnContext, TurnState turnState, CancellationToken cancellationToken)
        {
            Record.Add(MethodBase.GetCurrentMethod().Name);
            return base.OnMessagingExtensionSubmitActionDispatchAsync(action, turnContext, turnState, cancellationToken);
        }

        protected override Task<MessagingExtensionResponse> OnAppBasedLinkQueryAsync(AppBasedLinkQuery query, ITurnContext<IInvokeActivity> turnContext, TurnState turnState, CancellationToken cancellationToken)
        {
            Record.Add(MethodBase.GetCurrentMethod().Name);
            return Task.FromResult(new MessagingExtensionResponse());
        }

        protected override Task<MessagingExtensionResponse> OnAnonymousAppBasedLinkQueryAsync(AppBasedLinkQuery query, ITurnContext<IInvokeActivity> turnContext, TurnState turnState, CancellationToken cancellationToken)
        {
            Record.Add(MethodBase.GetCurrentMethod().Name);
            return Task.FromResult(new MessagingExtensionResponse());
        }

        protected override Task<InvokeResponse> OnCardActionInvokeAsync(ITurnContext<IInvokeActivity> turnContext, TurnState turnState, CancellationToken cancellationToken)
        {
            Record.Add(MethodBase.GetCurrentMethod().Name);
            return base.OnCardActionInvokeAsync(turnContext, turnState, cancellationToken);
        }

        protected override Task<TaskModuleResponse> OnTaskModuleFetchAsync(TaskModuleRequest taskModuleRequest, ITurnContext<IInvokeActivity> turnContext, TurnState turnState, CancellationToken cancellationToken)
        {
            Record.Add(MethodBase.GetCurrentMethod().Name);
            return Task.FromResult(new TaskModuleResponse());
        }

        protected override Task<TaskModuleResponse> OnTaskModuleSubmitAsync(TaskModuleRequest taskModuleRequest, ITurnContext<IInvokeActivity> turnContext, TurnState turnState, CancellationToken cancellationToken)
        {
            Record.Add(MethodBase.GetCurrentMethod().Name);
            return Task.FromResult(new TaskModuleResponse());
        }

        protected override Task OnSignInVerifyStateAsync(ITurnContext<IInvokeActivity> turnContext, TurnState turnState, CancellationToken cancellationToken)
        {
            Record.Add(MethodBase.GetCurrentMethod().Name);
            return Task.CompletedTask;
        }
        protected override Task OnSignInTokenExchangeAsync(ITurnContext<IInvokeActivity> turnContext, TurnState turnState, CancellationToken cancellationToken)
        {
            Record.Add(MethodBase.GetCurrentMethod().Name);
            return Task.CompletedTask;
        }

        protected override Task<TabResponse> OnTabFetchAsync(TabRequest taskModuleRequest, ITurnContext<IInvokeActivity> turnContext, TurnState turnState, CancellationToken cancellationToken)
        {
            Record.Add(MethodBase.GetCurrentMethod().Name);
            return Task.FromResult(new TabResponse());
        }

        protected override Task<TabResponse> OnTabSubmitAsync(TabSubmit taskModuleRequest, ITurnContext<IInvokeActivity> turnContext, TurnState turnState, CancellationToken cancellationToken)
        {
            Record.Add(MethodBase.GetCurrentMethod().Name);
            return Task.FromResult(new TabResponse());
        }

        protected override Task OnMeetingStartAsync(MeetingStartEventDetails meeting, ITurnContext<IEventActivity> turnContext, TurnState turnState, CancellationToken cancellationToken)
        {
            Record.Add(MethodBase.GetCurrentMethod().Name);
            turnContext.SendActivityAsync(meeting.StartTime.ToString());
            return Task.CompletedTask;
        }

        protected override Task OnMeetingEndAsync(MeetingEndEventDetails meeting, ITurnContext<IEventActivity> turnContext, TurnState turnState, CancellationToken cancellationToken)
        {
            Record.Add(MethodBase.GetCurrentMethod().Name);
            turnContext.SendActivityAsync(meeting.EndTime.ToString());
            return Task.CompletedTask;
        }

        protected override Task OnMessageEditAsync(ITurnContext<IMessageUpdateActivity> turnContext, TurnState turnState, CancellationToken cancellationToken)
        {
            Record.Add(MethodBase.GetCurrentMethod().Name);
            return base.OnMessageEditAsync(turnContext, turnState, cancellationToken);
        }

        protected override Task OnMessageUndeleteAsync(ITurnContext<IMessageUpdateActivity> turnContext, TurnState turnState, CancellationToken cancellationToken)
        {
            Record.Add(MethodBase.GetCurrentMethod().Name);
            return base.OnMessageUndeleteAsync(turnContext, turnState, cancellationToken);
        }

        protected override Task OnMessageSoftDeleteAsync(ITurnContext<IMessageDeleteActivity> turnContext, TurnState turnState, CancellationToken cancellationToken)
        {
            Record.Add(MethodBase.GetCurrentMethod().Name);
            return base.OnMessageSoftDeleteAsync(turnContext, turnState, cancellationToken);
        }
    }
}
