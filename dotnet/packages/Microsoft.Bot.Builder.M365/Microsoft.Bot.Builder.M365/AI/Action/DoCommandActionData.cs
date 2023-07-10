using Microsoft.Bot.Builder.M365.AI.Planner;

namespace Microsoft.Bot.Builder.M365.AI.Action
{
    internal class DoCommandActionData<TState> where TState : TurnState
    {
        public PredictedDoCommand? PredictedDoCommand { get; set; }
        public IActionHandler<TState>? Handler { get; set; }
    }
}
