using Microsoft.Bot.Builder.M365.AI.Planner;
using Microsoft.Bot.Builder.M365.State;

namespace Microsoft.Bot.Builder.M365.AI.Action
{
    /// <summary>
    /// The data for default DO command action handler.
    /// </summary>
    /// <typeparam name="TState">Type of turn state.</typeparam>
    public class DoCommandActionData<TState> where TState : ITurnState<StateBase, StateBase, TempState>
    {
        /// <summary>
        /// The predicted DO command.
        /// </summary>
        public PredictedDoCommand? PredictedDoCommand { get; set; }

        /// <summary>
        /// The handler to perform the predicted command.
        /// </summary>
        public IActionHandler<TState>? Handler { get; set; }
    }
}
