using Microsoft.Bot.Builder.M365.State;

namespace Microsoft.Bot.Builder.M365.AI.Prompt
{
    public delegate Task<string> PromptFunction<TState>(ITurnContext turnContext, TState turnState) where TState : ITurnState<StateBase, StateBase, TempState>;

    internal class TemplateFunctionEntry<TState> where TState : ITurnState<StateBase, StateBase, TempState>
    {
        internal PromptFunction<TState> Handler;

        internal bool AllowOverrides;

        internal TemplateFunctionEntry(PromptFunction<TState> handler, bool allowOverrides)
        {
            Handler = handler;
            AllowOverrides = allowOverrides;
        }
    }
}
