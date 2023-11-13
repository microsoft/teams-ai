using Microsoft.Bot.Builder;
using Microsoft.Teams.AI.AI;
using Microsoft.Teams.AI.AI.Planner;

namespace Microsoft.Teams.AI.Tests.TestUtils
{
    public class TestPlanner : IPlanner<TestTurnState>
    {
        public Plan BeginPlan { get; set; } = new Plan
        {
            Commands = new List<IPredictedCommand>
            {
                new PredictedSayCommand("Test-SAY")
            }
        };

        public Plan ContinuePlan { get; set; } = new Plan();

        public Task<Plan> BeginTaskAsync(ITurnContext turnContext, TestTurnState turnState, AI<TestTurnState> ai, CancellationToken cancellationToken)
        {
            return Task.FromResult(BeginPlan);
        }

        public Task<Plan> ContinueTaskAsync(ITurnContext turnContext, TestTurnState turnState, AI<TestTurnState> ai, CancellationToken cancellationToken)
        {
            return Task.FromResult(ContinuePlan);
        }
    }
}
