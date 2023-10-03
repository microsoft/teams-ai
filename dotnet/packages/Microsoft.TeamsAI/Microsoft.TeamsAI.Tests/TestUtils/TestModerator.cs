using System.Reflection;

using Microsoft.Bot.Builder;
using Microsoft.TeamsAI.AI.Moderator;
using Microsoft.TeamsAI.AI.Planner;
using Microsoft.TeamsAI.AI.Prompt;

namespace Microsoft.TeamsAI.Tests.TestUtils
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
