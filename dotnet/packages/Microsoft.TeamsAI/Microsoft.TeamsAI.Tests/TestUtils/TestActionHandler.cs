using Microsoft.Bot.Builder;
using Microsoft.Teams.AI.AI.Action;
using Microsoft.Teams.AI.State;

namespace Microsoft.Teams.AI.Tests.TestUtils
{
    public class TestActionHandler : IActionHandler<TurnState>
    {
        public string? ActionName { get; set; }

        public Task<string> PerformActionAsync(ITurnContext turnContext, TurnState turnState, object? entities = null, string? action = null, CancellationToken cancellationToken = default)
        {
            ActionName = action;
            return Task.FromResult("test-result");
        }
    }
}
