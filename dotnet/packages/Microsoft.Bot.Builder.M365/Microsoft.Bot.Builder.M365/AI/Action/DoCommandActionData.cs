﻿using Microsoft.Bot.Builder.M365.AI.Planner;
using Microsoft.Bot.Builder.M365.State;

namespace Microsoft.Bot.Builder.M365.AI.Action
{
    internal class DoCommandActionData<TState> where TState : ITurnState<StateBase, StateBase, TempState>
    {
        public PredictedDoCommand? PredictedDoCommand { get; set; }
        public ActionHandler<TState>? Handler { get; set; }
    }
}
