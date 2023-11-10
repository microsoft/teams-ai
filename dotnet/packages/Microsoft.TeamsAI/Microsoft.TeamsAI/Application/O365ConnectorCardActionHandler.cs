using Microsoft.Bot.Builder;
using Microsoft.Bot.Schema.Teams;
using Microsoft.Teams.AI.State;

namespace Microsoft.Teams.AI
{
    /// <summary>
    /// Function for handling O365 Connector Card Action activities.
    /// </summary>
    /// <typeparam name="TState">Type of the turn state. This allows for strongly typed access to the turn state.</typeparam>
    /// <param name="turnContext">A strongly-typed context object for this turn.</param>
    /// <param name="turnState">The turn state object that stores arbitrary data for this turn.</param>
    /// <param name="query">The O365 connector card HttpPOST invoke query.</param>
    /// <param name="cancellationToken">A cancellation token that can be used by other objects
    /// or threads to receive notice of cancellation.</param>
    /// <returns>A task that represents the work queued to execute.</returns>
    public delegate Task O365ConnectorCardActionHandler<TState>(ITurnContext turnContext, TState turnState, O365ConnectorCardActionQuery query, CancellationToken cancellationToken) where TState : ITurnState<StateBase, StateBase, TempState>;
}
