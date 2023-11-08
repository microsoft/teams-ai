using System.Reflection;

using Microsoft.Bot.Builder;
using Microsoft.Teams.AI.AI;
using Microsoft.Teams.AI.AI.Planner;
using Microsoft.Teams.AI.AI.Prompt;

namespace Microsoft.Teams.AI.Tests.TestUtils
{
    public class TestPlanner : IPlanner<TestTurnState>
    {
        public IList<string> Record { get; } = new List<string>();

        public string CompletePromptResult { get; set; } = "Default";

        public Plan GeneratePlanResult { get; set; } = new Plan
        {
            Commands = new List<IPredictedCommand>
            {
                new PredictedDoCommand("Test-DO"),
                new PredictedSayCommand("Test-SAY")
            }
        };

        public Task<string> CompletePromptAsync(ITurnContext turnContext, TestTurnState turnState, PromptTemplate promptTemplate, AIOptions<TestTurnState> options, CancellationToken cancellationToken)
        {
            Record.Add(MethodBase.GetCurrentMethod()!.Name);
            return Task.FromResult(CompletePromptResult);
        }

        public Task<Plan> GeneratePlanAsync(ITurnContext turnContext, TestTurnState turnState, PromptTemplate promptTemplate, AIOptions<TestTurnState> options, CancellationToken cancellationToken)
        {
            Record.Add(MethodBase.GetCurrentMethod()!.Name);
            return Task.FromResult(GeneratePlanResult);
        }
    }
}
