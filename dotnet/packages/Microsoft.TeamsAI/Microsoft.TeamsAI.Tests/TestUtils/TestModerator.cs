using System.Reflection;
using Microsoft.Bot.Builder;
using Microsoft.Teams.AI.AI.Moderator;
using Microsoft.Teams.AI.AI.Planner;
using Microsoft.Teams.AI.State;

namespace Microsoft.Teams.AI.Tests.TestUtils
{
    public class TestModerator : IModerator<TurnState>
    {
        public IList<string> Record { get; } = new List<string>();

        public Task<Plan> ReviewOutput(ITurnContext turnContext, TurnState turnState, Plan plan)
        {
            Record.Add(MethodBase.GetCurrentMethod()!.Name);
            return Task.FromResult(plan);
        }

        public Task<Plan?> ReviewInput(ITurnContext turnContext, TurnState turnState)
        {
            Record.Add(MethodBase.GetCurrentMethod()!.Name);
            return Task.FromResult<Plan?>(null);
        }
    }
}
