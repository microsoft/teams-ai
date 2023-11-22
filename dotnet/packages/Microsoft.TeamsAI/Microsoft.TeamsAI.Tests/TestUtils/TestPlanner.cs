using Microsoft.Bot.Builder;
using Microsoft.Teams.AI.AI;
using Microsoft.Teams.AI.AI.Planners;
using Microsoft.Teams.AI.State;
using System.Reflection;

namespace Microsoft.Teams.AI.Tests.TestUtils
{
    public class TestPlanner : IPlanner<TurnState>
    {
        public IList<string> Record { get; } = new List<string>();

        public Plan BeginPlan { get; set; } = new Plan
        {
            Commands = new List<IPredictedCommand>
            {
                new PredictedDoCommand("Test-DO"),
                new PredictedSayCommand("Test-SAY")
            }
        };

        public Plan ContinuePlan { get; set; } = new Plan
        {
            Commands = new List<IPredictedCommand>
            {
                new PredictedDoCommand("Test-DO"),
                new PredictedSayCommand("Test-SAY")
            }
        };

        public Task<Plan> BeginTaskAsync(ITurnContext turnContext, TurnState turnState, AI<TurnState> ai, CancellationToken cancellationToken)
        {
            Record.Add(MethodBase.GetCurrentMethod()!.Name);
            return Task.FromResult(BeginPlan);
        }

        public Task<Plan> ContinueTaskAsync(ITurnContext turnContext, TurnState turnState, AI<TurnState> ai, CancellationToken cancellationToken)
        {
            Record.Add(MethodBase.GetCurrentMethod()!.Name);
            return Task.FromResult(ContinuePlan);
        }
    }
}
