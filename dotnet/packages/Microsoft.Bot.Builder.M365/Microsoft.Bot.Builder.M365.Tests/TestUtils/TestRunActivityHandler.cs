using Microsoft.Bot.Schema;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using System.Text;
using System.Threading.Tasks;

namespace Microsoft.Bot.Builder.M365.Tests.TestUtils
{
    internal class TestRunActivityHandler : Application<TurnState>
    {
        public TestRunActivityHandler(ApplicationOptions<TurnState> options) : base(options)
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
            return Task.CompletedTask;
        }

        protected override Task OnMessageDeleteActivityAsync(ITurnContext<IMessageDeleteActivity> turnContext, TurnState turnState, CancellationToken cancellationToken)
        {
            Record.Add(MethodBase.GetCurrentMethod().Name);
            return Task.CompletedTask;
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
            return Task.CompletedTask;
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
    }
}
