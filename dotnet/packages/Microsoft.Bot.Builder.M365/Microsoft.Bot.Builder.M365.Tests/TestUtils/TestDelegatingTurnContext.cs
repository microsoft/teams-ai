using Microsoft.Bot.Schema;

namespace Microsoft.Bot.Builder.M365.Tests.TestUtils
{
    internal class TestDelegatingTurnContext : TestApplication
    {
        public TestDelegatingTurnContext(TestApplicationOptions options) : base(options)
        {
        }

        protected override async Task OnMessageActivityAsync(ITurnContext<IMessageActivity> turnContext, TestTurnState turnState, CancellationToken cancellationToken)
        {
            // touch every
            var activity = turnContext.Activity;
            var adapter = turnContext.Adapter;
            var turnContextState = turnContext.TurnState;
            var responsed = turnContext.Responded;
            turnContext.OnDeleteActivity((t, a, n) => Task.CompletedTask);
            turnContext.OnSendActivities((t, a, n) => Task.FromResult(new ResourceResponse[] { new ResourceResponse() }));
            turnContext.OnUpdateActivity((t, a, n) => Task.FromResult(new ResourceResponse()));
            await turnContext.DeleteActivityAsync(activity.GetConversationReference());
            await turnContext.SendActivityAsync(new Activity());
            await turnContext.SendActivitiesAsync(new IActivity[] { new Activity() });
            await turnContext.UpdateActivityAsync(new Activity());
        }
    }
}
