using System.Reflection;
using Microsoft.Bot.Builder;
using Microsoft.Teams.AI.AI.Moderator;
using Microsoft.Teams.AI.AI.Planners;

namespace Microsoft.Teams.AI.Tests.TestUtils
{
    public class TestModerator : IModerator<TestTurnState>
    {
        public IList<string> Record { get; } = new List<string>();

        public Task<Plan> ReviewOutputAsync(ITurnContext turnContext, TestTurnState turnState, Plan plan, CancellationToken cancellationToken = default)
        {
            Record.Add(MethodBase.GetCurrentMethod()!.Name);
            return Task.FromResult(plan);
        }

        public Task<Plan?> ReviewInputAsync(ITurnContext turnContext, TestTurnState turnState, CancellationToken cancellationToken = default)
        {
            Record.Add(MethodBase.GetCurrentMethod()!.Name);
            return Task.FromResult<Plan?>(null);
        }
    }
}
