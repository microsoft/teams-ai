using Microsoft.Bot.Builder.M365.State;

namespace Microsoft.Bot.Builder.M365.Tests.TestUtils
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
