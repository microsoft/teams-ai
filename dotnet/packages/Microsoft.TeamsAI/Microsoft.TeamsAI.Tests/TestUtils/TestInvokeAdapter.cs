using Microsoft.Copilot.BotBuilder;
using Microsoft.Copilot.Protocols.Primitives;

namespace Microsoft.Teams.AI.Tests.TestUtils
{
    internal sealed class TestInvokeAdapter : NotImplementedAdapter
    {
        public IActivity? Activity { get; private set; }

        public override Task<ResourceResponse[]> SendActivitiesAsync(ITurnContext turnContext, IActivity[] activities, CancellationToken cancellationToken)
        {
            Activity = activities.FirstOrDefault(activity => activity.Type == ActivityTypes.InvokeResponse);
            return Task.FromResult(new ResourceResponse[0]);
        }
    }
}
