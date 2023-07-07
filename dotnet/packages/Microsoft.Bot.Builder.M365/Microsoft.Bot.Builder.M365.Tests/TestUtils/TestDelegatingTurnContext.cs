using Microsoft.Bot.Schema;
using Microsoft.Bot.Builder.M365.State;

namespace Microsoft.Bot.Builder.M365.Tests.TestUtils
{
    internal class TestDelegatingTurnContext : Application<TurnState, TurnStateManager>
    {
        public TestDelegatingTurnContext(ApplicationOptions<TurnState, TurnStateManager> options) : base(options)
        {
        }

        protected override async Task OnMessageActivityAsync(ITurnContext<IMessageActivity> turnContext, TurnState turnState, CancellationToken cancellationToken)
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
