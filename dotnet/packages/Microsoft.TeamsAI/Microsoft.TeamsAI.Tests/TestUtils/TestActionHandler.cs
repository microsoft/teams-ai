using Microsoft.Bot.Builder;
using Microsoft.Teams.AI.AI.Action;

namespace Microsoft.Teams.AI.Tests.TestUtils
{
    public class TestActionHandler : IActionHandler<TestTurnState>
    {
        public string? ActionName { get; set; }

        public Task<string> PerformActionAsync(ITurnContext turnContext, TestTurnState turnState, object? entities = null, string? action = null, CancellationToken cancellationToken = default)
        {
            ActionName = action;
            return Task.FromResult("test-result");
        }
    }
}
