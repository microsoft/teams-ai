﻿using Microsoft.Bot.Schema;
using Microsoft.Bot.Schema.Teams;
using Newtonsoft.Json.Linq;
using System.Reflection;
using Microsoft.Bot.Builder.M365.State;

namespace Microsoft.Bot.Builder.M365.Tests.TestUtils
{
    internal class TestActivityHandler : TestApplication
    {
        public TestActivityHandler(TestApplicationOptions options) : base(options)
        {
        }

        public List<string> Record { get; } = new List<string>();

        protected override Task OnMessageActivityAsync(ITurnContext<IMessageActivity> turnContext, TestTurnState turnState, CancellationToken cancellationToken)
        {
            Record.Add(MethodBase.GetCurrentMethod().Name);
            return base.OnMessageActivityAsync(turnContext, turnState, cancellationToken);
        }

        protected override Task OnMessageUpdateActivityAsync(ITurnContext<IMessageUpdateActivity> turnContext, TestTurnState turnState, CancellationToken cancellationToken)
        {
            Record.Add(MethodBase.GetCurrentMethod().Name);
            return base.OnMessageUpdateActivityAsync(turnContext, turnState, cancellationToken);
        }

        protected override Task OnMessageDeleteActivityAsync(ITurnContext<IMessageDeleteActivity> turnContext, TestTurnState turnState, CancellationToken cancellationToken)
        {
            Record.Add(MethodBase.GetCurrentMethod().Name);
            return base.OnMessageDeleteActivityAsync(turnContext, turnState, cancellationToken);
        }

        protected override Task OnConversationUpdateActivityAsync(ITurnContext<IConversationUpdateActivity> turnContext, TestTurnState turnState, CancellationToken cancellationToken)
        {
            Record.Add(MethodBase.GetCurrentMethod().Name);
            return base.OnConversationUpdateActivityAsync(turnContext, turnState, cancellationToken);
        }

        protected override Task OnMembersAddedAsync(IList<ChannelAccount> membersAdded, ITurnContext<IConversationUpdateActivity> turnContext, TestTurnState turnState, CancellationToken cancellationToken)
        {
            Record.Add(MethodBase.GetCurrentMethod().Name);
            return base.OnMembersAddedAsync(membersAdded, turnContext, turnState, cancellationToken);
        }

        protected override Task OnMembersRemovedAsync(IList<ChannelAccount> membersRemoved, ITurnContext<IConversationUpdateActivity> turnContext, TestTurnState turnState, CancellationToken cancellationToken)
        {
            Record.Add(MethodBase.GetCurrentMethod().Name);
            return base.OnMembersRemovedAsync(membersRemoved, turnContext, turnState, cancellationToken);
        }

        protected override Task OnMessageReactionActivityAsync(ITurnContext<IMessageReactionActivity> turnContext, TestTurnState turnState, CancellationToken cancellationToken)
        {
            Record.Add(MethodBase.GetCurrentMethod().Name);
            return base.OnMessageReactionActivityAsync(turnContext, turnState, cancellationToken);
        }

        protected override Task OnReactionsAddedAsync(IList<MessageReaction> messageReactions, ITurnContext<IMessageReactionActivity> turnContext, TestTurnState turnState, CancellationToken cancellationToken)
        {
            Record.Add(MethodBase.GetCurrentMethod().Name);
            return base.OnReactionsAddedAsync(messageReactions, turnContext, turnState, cancellationToken);
        }

        protected override Task OnReactionsRemovedAsync(IList<MessageReaction> messageReactions, ITurnContext<IMessageReactionActivity> turnContext, TestTurnState turnState, CancellationToken cancellationToken)
        {
            Record.Add(MethodBase.GetCurrentMethod().Name);
            return base.OnReactionsRemovedAsync(messageReactions, turnContext, turnState, cancellationToken);
        }

        protected override Task OnEventActivityAsync(ITurnContext<IEventActivity> turnContext, TestTurnState turnState, CancellationToken cancellationToken)
        {
            Record.Add(MethodBase.GetCurrentMethod().Name);
            return base.OnEventActivityAsync(turnContext, turnState, cancellationToken);
        }

        protected override Task OnTokenResponseEventAsync(ITurnContext<IEventActivity> turnContext, TestTurnState turnState, CancellationToken cancellationToken)
        {
            Record.Add(MethodBase.GetCurrentMethod().Name);
            return base.OnTokenResponseEventAsync(turnContext, turnState, cancellationToken);
        }

        protected override Task OnEventAsync(ITurnContext<IEventActivity> turnContext, TestTurnState turnState, CancellationToken cancellationToken)
        {
            Record.Add(MethodBase.GetCurrentMethod().Name);
            return base.OnEventAsync(turnContext, turnState, cancellationToken);
        }

        protected override Task OnEndOfConversationActivityAsync(ITurnContext<IEndOfConversationActivity> turnContext, TestTurnState turnState, CancellationToken cancellationToken)
        {
            Record.Add(MethodBase.GetCurrentMethod().Name);
            return base.OnEndOfConversationActivityAsync(turnContext, turnState, cancellationToken);
        }

        protected override Task OnTypingActivityAsync(ITurnContext<ITypingActivity> turnContext, TestTurnState turnState, CancellationToken cancellationToken)
        {
            Record.Add(MethodBase.GetCurrentMethod().Name);
            return base.OnTypingActivityAsync(turnContext, turnState, cancellationToken);
        }

        protected override Task OnInstallationUpdateActivityAsync(ITurnContext<IInstallationUpdateActivity> turnContext, TestTurnState turnState, CancellationToken cancellationToken)
        {
            Record.Add(MethodBase.GetCurrentMethod().Name);
            return base.OnInstallationUpdateActivityAsync(turnContext, turnState, cancellationToken);
        }

        protected override Task OnCommandActivityAsync(ITurnContext<ICommandActivity> turnContext, TestTurnState turnState, CancellationToken cancellationToken)
        {
            Record.Add(MethodBase.GetCurrentMethod().Name);
            return base.OnCommandActivityAsync(turnContext, turnState, cancellationToken);
        }

        protected override Task OnCommandResultActivityAsync(ITurnContext<ICommandResultActivity> turnContext, TestTurnState turnState, CancellationToken cancellationToken)
        {
            Record.Add(MethodBase.GetCurrentMethod().Name);
            return base.OnCommandResultActivityAsync(turnContext, turnState, cancellationToken);
        }

        protected override Task OnUnrecognizedActivityTypeAsync(ITurnContext turnContext, TestTurnState turnState, CancellationToken cancellationToken)
        {
            Record.Add(MethodBase.GetCurrentMethod().Name);
            return base.OnUnrecognizedActivityTypeAsync(turnContext, turnState, cancellationToken);
        }

        protected override Task<InvokeResponse> OnInvokeActivityAsync(ITurnContext<IInvokeActivity> turnContext, TestTurnState turnState, CancellationToken cancellationToken)
        {
            Record.Add(MethodBase.GetCurrentMethod().Name);
            if (turnContext.Activity.Name == "some.random.invoke")
            {
                return Task.FromResult(CreateInvokeResponse(null));
            }

            return base.OnInvokeActivityAsync(turnContext, turnState, cancellationToken);
        }

        protected override Task OnSignInInvokeAsync(ITurnContext<IInvokeActivity> turnContext, TestTurnState turnState, CancellationToken cancellationToken)
        {
            Record.Add(MethodBase.GetCurrentMethod().Name);
            return base.OnSignInInvokeAsync(turnContext, turnState, cancellationToken);
        }

        protected override Task OnInstallationUpdateAddAsync(ITurnContext<IInstallationUpdateActivity> turnContext, TestTurnState turnState, CancellationToken cancellationToken)
        {
            Record.Add(MethodBase.GetCurrentMethod().Name);
            return base.OnInstallationUpdateAddAsync(turnContext, turnState, cancellationToken);
        }

        protected override Task OnInstallationUpdateRemoveAsync(ITurnContext<IInstallationUpdateActivity> turnContext, TestTurnState turnState, CancellationToken cancellationToken)
        {
            Record.Add(MethodBase.GetCurrentMethod().Name);
            return base.OnInstallationUpdateRemoveAsync(turnContext, turnState, cancellationToken);
        }

        protected override Task<AdaptiveCardInvokeResponse> OnAdaptiveCardActionExecuteAsync(AdaptiveCardInvokeValue invokeValue, ITurnContext<IInvokeActivity> turnContext, TestTurnState turnState, CancellationToken cancellationToken)
        {
            Record.Add(MethodBase.GetCurrentMethod().Name);
            return Task.FromResult(new AdaptiveCardInvokeResponse());
        }

        protected override Task<SearchInvokeResponse> OnSearchInvokeAsync(SearchInvokeValue invokeValue, ITurnContext<IInvokeActivity> turnContext, TestTurnState turnState, CancellationToken cancellationToken)
        {
            Record.Add(MethodBase.GetCurrentMethod().Name);
            return Task.FromResult(new SearchInvokeResponse());
        }

        protected override Task OnChannelCreatedAsync(ChannelInfo channelInfo, TeamInfo teamInfo, ITurnContext<IConversationUpdateActivity> turnContext, TestTurnState turnState, CancellationToken cancellationToken)
        {
            Record.Add(MethodBase.GetCurrentMethod().Name);
            return base.OnChannelCreatedAsync(channelInfo, teamInfo, turnContext, turnState, cancellationToken);
        }

        protected override Task OnChannelDeletedAsync(ChannelInfo channelInfo, TeamInfo teamInfo, ITurnContext<IConversationUpdateActivity> turnContext, TestTurnState turnState, CancellationToken cancellationToken)
        {
            Record.Add(MethodBase.GetCurrentMethod().Name);
            return base.OnChannelDeletedAsync(channelInfo, teamInfo, turnContext, turnState, cancellationToken);
        }

        protected override Task OnChannelRenamedAsync(ChannelInfo channelInfo, TeamInfo teamInfo, ITurnContext<IConversationUpdateActivity> turnContext, TestTurnState turnState, CancellationToken cancellationToken)
        {
            Record.Add(MethodBase.GetCurrentMethod().Name);
            return base.OnChannelRenamedAsync(channelInfo, teamInfo, turnContext, turnState, cancellationToken);
        }

        protected override Task OnChannelRestoredAsync(ChannelInfo channelInfo, TeamInfo teamInfo, ITurnContext<IConversationUpdateActivity> turnContext, TestTurnState turnState, CancellationToken cancellationToken)
        {
            Record.Add(MethodBase.GetCurrentMethod().Name);
            return base.OnChannelRestoredAsync(channelInfo, teamInfo, turnContext, turnState, cancellationToken);
        }

        protected override Task OnTeamArchivedAsync(TeamInfo teamInfo, ITurnContext<IConversationUpdateActivity> turnContext, TestTurnState turnState, CancellationToken cancellationToken)
        {
            Record.Add(MethodBase.GetCurrentMethod().Name);
            return base.OnTeamArchivedAsync(teamInfo, turnContext, turnState, cancellationToken);
        }

        protected override Task OnTeamDeletedAsync(TeamInfo teamInfo, ITurnContext<IConversationUpdateActivity> turnContext, TestTurnState turnState, CancellationToken cancellationToken)
        {
            Record.Add(MethodBase.GetCurrentMethod().Name);
            return base.OnTeamDeletedAsync(teamInfo, turnContext, turnState, cancellationToken);
        }

        protected override Task OnTeamHardDeletedAsync(TeamInfo teamInfo, ITurnContext<IConversationUpdateActivity> turnContext, TestTurnState turnState, CancellationToken cancellationToken)
        {
            Record.Add(MethodBase.GetCurrentMethod().Name);
            return base.OnTeamHardDeletedAsync(teamInfo, turnContext, turnState, cancellationToken);
        }

        protected override Task OnTeamRenamedAsync(TeamInfo teamInfo, ITurnContext<IConversationUpdateActivity> turnContext, TestTurnState turnState, CancellationToken cancellationToken)
        {
            Record.Add(MethodBase.GetCurrentMethod().Name);
            return base.OnTeamRenamedAsync(teamInfo, turnContext, turnState, cancellationToken);
        }

        protected override Task OnTeamRestoredAsync(TeamInfo teamInfo, ITurnContext<IConversationUpdateActivity> turnContext, TestTurnState turnState, CancellationToken cancellationToken)
        {
            Record.Add(MethodBase.GetCurrentMethod().Name);
            return base.OnTeamRestoredAsync(teamInfo, turnContext, turnState, cancellationToken);
        }

        protected override Task OnTeamUnarchivedAsync(TeamInfo teamInfo, ITurnContext<IConversationUpdateActivity> turnContext, TestTurnState turnState, CancellationToken cancellationToken)
        {
            Record.Add(MethodBase.GetCurrentMethod().Name);
            return base.OnTeamUnarchivedAsync(teamInfo, turnContext, turnState, cancellationToken);
        }

        protected override Task OnMembersAddedAsync(IList<TeamsChannelAccount> membersAdded, TeamInfo teamInfo, ITurnContext<IConversationUpdateActivity> turnContext, TestTurnState turnState, CancellationToken cancellationToken)
        {
            Record.Add(MethodBase.GetCurrentMethod().Name);
            return base.OnMembersAddedAsync(membersAdded, teamInfo, turnContext, turnState, cancellationToken);
        }

        protected override Task OnMembersRemovedAsync(IList<TeamsChannelAccount> membersRemoved, TeamInfo teamInfo, ITurnContext<IConversationUpdateActivity> turnContext, TestTurnState turnState, CancellationToken cancellationToken)
        {
            Record.Add(MethodBase.GetCurrentMethod().Name);
            return base.OnMembersRemovedAsync(membersRemoved, teamInfo, turnContext, turnState, cancellationToken);
        }

        protected override Task OnReadReceiptAsync(ReadReceiptInfo readReceiptInfo, ITurnContext<IEventActivity> turnContext, TestTurnState turnState, CancellationToken cancellationToken)
        {
            Record.Add(MethodBase.GetCurrentMethod().Name);
            turnContext.SendActivityAsync(readReceiptInfo.LastReadMessageId);
            return base.OnReadReceiptAsync(readReceiptInfo, turnContext, turnState, cancellationToken);
        }

        protected override Task<InvokeResponse> OnFileConsentAsync(FileConsentCardResponse fileConsentCardResponse, ITurnContext<IInvokeActivity> turnContext, TestTurnState turnState, CancellationToken cancellationToken)
        {
            Record.Add(MethodBase.GetCurrentMethod().Name);
            return base.OnFileConsentAsync(fileConsentCardResponse, turnContext, turnState, cancellationToken);
        }

        protected override Task OnFileConsentAcceptAsync(FileConsentCardResponse fileConsentCardResponse, ITurnContext<IInvokeActivity> turnContext, TestTurnState turnState, CancellationToken cancellationToken)
        {
            Record.Add(MethodBase.GetCurrentMethod().Name);
            return Task.CompletedTask;
        }

        protected override Task OnFileConsentDeclineAsync(FileConsentCardResponse fileConsentCardResponse, ITurnContext<IInvokeActivity> turnContext, TestTurnState turnState, CancellationToken cancellationToken)
        {
            Record.Add(MethodBase.GetCurrentMethod().Name);
            return Task.CompletedTask;
        }

        protected override Task OnO365ConnectorCardActionAsync(O365ConnectorCardActionQuery query, ITurnContext<IInvokeActivity> turnContext, TestTurnState turnState, CancellationToken cancellationToken)
        {
            Record.Add(MethodBase.GetCurrentMethod().Name);
            return Task.CompletedTask;
        }

        protected override Task<MessagingExtensionActionResponse> OnMessagingExtensionBotMessagePreviewEditAsync(MessagingExtensionAction action, ITurnContext<IInvokeActivity> turnContext, TestTurnState turnState, CancellationToken cancellationToken)
        {
            Record.Add(MethodBase.GetCurrentMethod().Name);
            return Task.FromResult(new MessagingExtensionActionResponse());
        }

        protected override Task<MessagingExtensionActionResponse> OnMessagingExtensionBotMessagePreviewSendAsync(MessagingExtensionAction action, ITurnContext<IInvokeActivity> turnContext, TestTurnState turnState, CancellationToken cancellationToken)
        {
            Record.Add(MethodBase.GetCurrentMethod().Name);
            return Task.FromResult(new MessagingExtensionActionResponse());
        }

        protected override Task OnMessagingExtensionCardButtonClickedAsync(JObject obj, ITurnContext<IInvokeActivity> turnContext, TestTurnState turnState, CancellationToken cancellationToken)
        {
            Record.Add(MethodBase.GetCurrentMethod().Name);
            return base.OnMessagingExtensionCardButtonClickedAsync(obj, turnContext, turnState, cancellationToken);
        }

        protected override Task<MessagingExtensionActionResponse> OnMessagingExtensionFetchTaskAsync(MessagingExtensionAction action, ITurnContext<IInvokeActivity> turnContext, TestTurnState turnState, CancellationToken cancellationToken)
        {
            Record.Add(MethodBase.GetCurrentMethod().Name);
            return Task.FromResult(new MessagingExtensionActionResponse());
        }

        protected override Task<MessagingExtensionResponse> OnMessagingExtensionConfigurationQuerySettingUrlAsync(MessagingExtensionQuery query, ITurnContext<IInvokeActivity> turnContext, TestTurnState turnState, CancellationToken cancellationToken)
        {
            Record.Add(MethodBase.GetCurrentMethod().Name);
            return Task.FromResult(new MessagingExtensionResponse());
        }

        protected override Task OnMessagingExtensionConfigurationSettingAsync(JObject obj, ITurnContext<IInvokeActivity> turnContext, TestTurnState turnState, CancellationToken cancellationToken)
        {
            Record.Add(MethodBase.GetCurrentMethod().Name);
            return Task.CompletedTask;
        }

        protected override Task<MessagingExtensionResponse> OnMessagingExtensionQueryAsync(MessagingExtensionQuery query, ITurnContext<IInvokeActivity> turnContext, TestTurnState turnState, CancellationToken cancellationToken)
        {
            Record.Add(MethodBase.GetCurrentMethod().Name);
            return Task.FromResult(new MessagingExtensionResponse());
        }

        protected override Task<MessagingExtensionResponse> OnMessagingExtensionSelectItemAsync(JObject query, ITurnContext<IInvokeActivity> turnContext, TestTurnState turnState, CancellationToken cancellationToken)
        {
            Record.Add(MethodBase.GetCurrentMethod().Name);
            return Task.FromResult(new MessagingExtensionResponse());
        }

        protected override Task<MessagingExtensionActionResponse> OnMessagingExtensionSubmitActionAsync(MessagingExtensionAction action, ITurnContext<IInvokeActivity> turnContext, TestTurnState turnState, CancellationToken cancellationToken)
        {
            Record.Add(MethodBase.GetCurrentMethod().Name);
            return Task.FromResult(new MessagingExtensionActionResponse());
        }

        protected override Task<MessagingExtensionActionResponse> OnMessagingExtensionSubmitActionDispatchAsync(MessagingExtensionAction action, ITurnContext<IInvokeActivity> turnContext, TestTurnState turnState, CancellationToken cancellationToken)
        {
            Record.Add(MethodBase.GetCurrentMethod().Name);
            return base.OnMessagingExtensionSubmitActionDispatchAsync(action, turnContext, turnState, cancellationToken);
        }

        protected override Task<MessagingExtensionResponse> OnAppBasedLinkQueryAsync(AppBasedLinkQuery query, ITurnContext<IInvokeActivity> turnContext, TestTurnState turnState, CancellationToken cancellationToken)
        {
            Record.Add(MethodBase.GetCurrentMethod().Name);
            return Task.FromResult(new MessagingExtensionResponse());
        }

        protected override Task<MessagingExtensionResponse> OnAnonymousAppBasedLinkQueryAsync(AppBasedLinkQuery query, ITurnContext<IInvokeActivity> turnContext, TestTurnState turnState, CancellationToken cancellationToken)
        {
            Record.Add(MethodBase.GetCurrentMethod().Name);
            return Task.FromResult(new MessagingExtensionResponse());
        }

        protected override Task<InvokeResponse> OnCardActionInvokeAsync(ITurnContext<IInvokeActivity> turnContext, TestTurnState turnState, CancellationToken cancellationToken)
        {
            Record.Add(MethodBase.GetCurrentMethod().Name);
            return base.OnCardActionInvokeAsync(turnContext, turnState, cancellationToken);
        }

        protected override Task<TaskModuleResponse> OnTaskModuleFetchAsync(TaskModuleRequest taskModuleRequest, ITurnContext<IInvokeActivity> turnContext, TestTurnState turnState, CancellationToken cancellationToken)
        {
            Record.Add(MethodBase.GetCurrentMethod().Name);
            return Task.FromResult(new TaskModuleResponse());
        }

        protected override Task<TaskModuleResponse> OnTaskModuleSubmitAsync(TaskModuleRequest taskModuleRequest, ITurnContext<IInvokeActivity> turnContext, TestTurnState turnState, CancellationToken cancellationToken)
        {
            Record.Add(MethodBase.GetCurrentMethod().Name);
            return Task.FromResult(new TaskModuleResponse());
        }

        protected override Task OnSignInVerifyStateAsync(ITurnContext<IInvokeActivity> turnContext, TestTurnState turnState, CancellationToken cancellationToken)
        {
            Record.Add(MethodBase.GetCurrentMethod().Name);
            return Task.CompletedTask;
        }
        protected override Task OnSignInTokenExchangeAsync(ITurnContext<IInvokeActivity> turnContext, TestTurnState turnState, CancellationToken cancellationToken)
        {
            Record.Add(MethodBase.GetCurrentMethod().Name);
            return Task.CompletedTask;
        }

        protected override Task<TabResponse> OnTabFetchAsync(TabRequest taskModuleRequest, ITurnContext<IInvokeActivity> turnContext, TestTurnState turnState, CancellationToken cancellationToken)
        {
            Record.Add(MethodBase.GetCurrentMethod().Name);
            return Task.FromResult(new TabResponse());
        }

        protected override Task<TabResponse> OnTabSubmitAsync(TabSubmit taskModuleRequest, ITurnContext<IInvokeActivity> turnContext, TestTurnState turnState, CancellationToken cancellationToken)
        {
            Record.Add(MethodBase.GetCurrentMethod().Name);
            return Task.FromResult(new TabResponse());
        }

        protected override Task OnMeetingStartAsync(MeetingStartEventDetails meeting, ITurnContext<IEventActivity> turnContext, TestTurnState turnState, CancellationToken cancellationToken)
        {
            Record.Add(MethodBase.GetCurrentMethod().Name);
            turnContext.SendActivityAsync(meeting.StartTime.ToString());
            return base.OnMeetingStartAsync(meeting, turnContext, turnState, cancellationToken);
        }

        protected override Task OnMeetingEndAsync(MeetingEndEventDetails meeting, ITurnContext<IEventActivity> turnContext, TestTurnState turnState, CancellationToken cancellationToken)
        {
            Record.Add(MethodBase.GetCurrentMethod().Name);
            turnContext.SendActivityAsync(meeting.EndTime.ToString());
            return base.OnMeetingEndAsync(meeting, turnContext, turnState, cancellationToken);
        }

        protected override Task OnMessageEditAsync(ITurnContext<IMessageUpdateActivity> turnContext, TestTurnState turnState, CancellationToken cancellationToken)
        {
            Record.Add(MethodBase.GetCurrentMethod().Name);
            return base.OnMessageEditAsync(turnContext, turnState, cancellationToken);
        }

        protected override Task OnMessageUndeleteAsync(ITurnContext<IMessageUpdateActivity> turnContext, TestTurnState turnState, CancellationToken cancellationToken)
        {
            Record.Add(MethodBase.GetCurrentMethod().Name);
            return base.OnMessageUndeleteAsync(turnContext, turnState, cancellationToken);
        }

        protected override Task OnMessageSoftDeleteAsync(ITurnContext<IMessageDeleteActivity> turnContext, TestTurnState turnState, CancellationToken cancellationToken)
        {
            Record.Add(MethodBase.GetCurrentMethod().Name);
            return base.OnMessageSoftDeleteAsync(turnContext, turnState, cancellationToken);
        }
    }
}
