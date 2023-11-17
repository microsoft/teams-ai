using Microsoft.Bot.Builder;

namespace Microsoft.Teams.AI.State
{
    /// <summary>
    /// Turn state used for testing purposes.
    /// </summary>
    public class TestTurnState : TurnState
    {
        private TestTurnState() : base() { }

        /// <summary>
        /// Returns a test turn state based on loaded configured options.
        /// </summary>
        /// <param name="turnContext">Current turn context.</param>
        /// <param name="testState">Options for TestTurnState class.</param>
        /// <returns></returns>
        public static async Task<TestTurnState> Create(ITurnContext turnContext, TestTurnStateOptions testState)
        {
            MemoryStorage storage = new();
            TestTurnState state = new();
            await state.LoadStateAsync(storage, turnContext);

            if (testState != null)
            {
                if (testState.User != null)
                {
                    state.User = testState.User;
                }
                if (testState.Conversation != null)
                {
                    state.Conversation = testState.Conversation;
                }
                if (testState.Temp != null)
                {
                    state.Temp = testState.Temp;
                }

            }
            return state;
        }
    }
}
