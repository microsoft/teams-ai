namespace Microsoft.Bot.Builder.M365.AI.Prompt
{
    public delegate Task<string> PromptFunction<TState>(TurnContext turnContext, TState turnState) where TState : TurnState;

    internal class TemplateFunctionEntry<TState> where TState : TurnState
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
