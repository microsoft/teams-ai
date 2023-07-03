using Microsoft.Bot.Schema;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Microsoft.Bot.Builder.M365.State;

namespace Microsoft.Bot.Builder.M365.Tests.TestUtils
{
    internal class TestDelegatingTurnContext : Application<TurnState>
    {
        public TestDelegatingTurnContext(ApplicationOptions<TurnState> options) : base(options)
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
