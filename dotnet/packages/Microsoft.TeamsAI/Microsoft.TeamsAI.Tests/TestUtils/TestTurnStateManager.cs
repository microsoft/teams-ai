using Microsoft.Bot.Builder;
using Microsoft.TeamsAI.State;

namespace Microsoft.TeamsAI.Tests.TestUtils
{
    public class TestTurnStateManager : ITurnStateManager<TestTurnState>
    {
        public Task<TestTurnState> LoadStateAsync(IStorage? storage, ITurnContext turnContext)
        {
            return Task.FromResult(new TestTurnState());
        }

        public Task SaveStateAsync(IStorage? storage, ITurnContext turnContext, TestTurnState turnState)
        {
            return Task.FromResult(true);
        }
    }
}
