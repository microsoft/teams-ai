using Microsoft.Bot.Builder;
using Microsoft.Teams.AI.State;

namespace Microsoft.Teams.AI
{
    /// <summary>
    /// Turn event handler to do something before or after a turn is run. Returning false from
    /// `beforeTurn` lets you prevent the turn from running and returning false from `afterTurn`
    /// lets you prevent the bots state from being saved.
    /// <br/>
    /// <br/>
    /// Returning false from `beforeTurn` does result in the bots state being saved which lets you
    /// track the reason why the turn was not processed. It also means you can use `beforeTurn` as
    /// a way to call into the dialog system. For example, you could use the OAuthPrompt to sign the
    /// user in before allowing the AI system to run.
    /// </summary>
    /// <typeparam name="TState"></typeparam>
    /// <param name="turnContext">A strongly-typed context object for this turn.</param>
    /// <param name="turnState">The turn state object that stores arbitrary data for this turn.</param>
    /// <param name="cancellationToken">A cancellation token that can be used by other objects
    /// or threads to receive notice of cancellation.</param>
    /// <returns>True to continue execution of the current turn. Otherwise, False.</returns>
    public delegate Task<bool> TurnEventHandler<TState>(ITurnContext turnContext, TState turnState, CancellationToken cancellationToken) where TState : ITurnState<StateBase, StateBase, TempState>;
}
