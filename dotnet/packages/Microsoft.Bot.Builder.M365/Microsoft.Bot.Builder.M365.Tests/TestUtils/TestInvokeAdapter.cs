using Microsoft.Bot.Schema;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Microsoft.Bot.Builder.M365.Tests.TestUtils
{
    internal class TestInvokeAdapter : NotImplementedAdapter
    {
        public IActivity Activity { get; private set; }

        public override Task<ResourceResponse[]> SendActivitiesAsync(ITurnContext turnContext, Activity[] activities, CancellationToken cancellationToken)
        {
            Activity = activities.FirstOrDefault(activity => activity.Type == ActivityTypesEx.InvokeResponse);
            return Task.FromResult(new ResourceResponse[0]);
        }
    }
}
