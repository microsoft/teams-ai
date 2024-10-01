using Microsoft.Copilot.BotBuilder;
using Microsoft.Copilot.Protocols.Adapter;
using Microsoft.Copilot.Protocols.Primitives;

namespace Microsoft.Teams.AI.Tests.TestUtils
{
    internal class NotImplementedAdapter : BotAdapter
    {
        public override Task DeleteActivityAsync(ITurnContext turnContext, ConversationReference reference, CancellationToken cancellationToken)
        {
            throw new NotImplementedException();
        }

        public override Task<ResourceResponse[]> SendActivitiesAsync(ITurnContext turnContext, IActivity[] activities, CancellationToken cancellationToken)
        {
            throw new NotImplementedException();
        }

        public override Task<ResourceResponse> UpdateActivityAsync(ITurnContext turnContext, IActivity activity, CancellationToken cancellationToken)
        {
            throw new NotImplementedException();
        }
    }
}
