using System.Reflection;

using Microsoft.Bot.Builder;
using Microsoft.Teams.AI.AI.Moderator;
using Microsoft.Teams.AI.AI.Planner;
using Microsoft.Teams.AI.AI.Prompt;

namespace Microsoft.Teams.AI.Tests.TestUtils
{
    public class TestModerator : IModerator<TestTurnState>
    {
        public IList<string> Record { get; } = new List<string>();

        public Task<Plan> ReviewPlan(ITurnContext turnContext, TestTurnState turnState, Plan plan)
        {
            Record.Add(MethodBase.GetCurrentMethod()!.Name);
            return Task.FromResult(plan);
        }

        public Task<Plan?> ReviewPrompt(ITurnContext turnContext, TestTurnState turnState, PromptTemplate prompt)
        {
            Record.Add(MethodBase.GetCurrentMethod()!.Name);
            return Task.FromResult<Plan?>(null);
        }
    }
}
