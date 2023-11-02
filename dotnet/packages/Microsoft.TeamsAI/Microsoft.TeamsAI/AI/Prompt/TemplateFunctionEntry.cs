using Microsoft.Bot.Builder;
using Microsoft.Teams.AI.State;

namespace Microsoft.Teams.AI.AI.Prompt
{
    /// <summary>
    /// The prompt function delegate.
    /// </summary>
    /// <typeparam name="TState">The turn state class.</typeparam>
    /// <param name="turnContext">The turn context.</param>
    /// <param name="turnState">The turn state.</param>
    /// <returns>A string that is injected in the prompt template.</returns>
    public delegate Task<string> PromptFunction<TState>(ITurnContext turnContext, TState turnState) where TState : ITurnState<StateBase, StateBase, TempState>;

    internal sealed class TemplateFunctionEntry<TState> where TState : ITurnState<StateBase, StateBase, TempState>
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
