using Microsoft.Bot.Builder;
using Microsoft.Teams.AI.State;

namespace Microsoft.Teams.AI
{
    /// <summary>
    /// Function for selecting whether a route handler should be triggered.
    /// </summary>
    /// <param name="turnContext">Context for the current turn of conversation with the user.</param>
    /// <param name="cancellationToken">A cancellation token that can be used by other objects
    /// or threads to receive notice of cancellation.</param>
    /// <returns>True if the route handler should be triggered. Otherwise, False.</returns>
    public delegate Task<bool> RouteSelector(ITurnContext turnContext, CancellationToken cancellationToken);

    /// <summary>
    /// The common route handler. Function for handling an incoming request.
    /// </summary>
    /// <typeparam name="TState">Type of the turn state. This allows for strongly typed access to the turn state.</typeparam>
    /// <param name="turnContext">A strongly-typed context object for this turn.</param>
    /// <param name="turnState">The turn state object that stores arbitrary data for this turn.</param>
    /// <param name="cancellationToken">A cancellation token that can be used by other objects
    /// or threads to receive notice of cancellation.</param>
    /// <returns></returns>
    public delegate Task RouteHandler<TState>(ITurnContext turnContext, TState turnState, CancellationToken cancellationToken) where TState : ITurnState<StateBase, StateBase, TempState>;

    internal class Route<TState> where TState : ITurnState<StateBase, StateBase, TempState>
    {
        public Route(RouteSelector selector, bool isInvokeRoute = false)
        {
            Selector = selector;
            Handler = (_, _, _) => Task.CompletedTask;
            IsInvokeRoute = isInvokeRoute;
        }

        public Route(RouteHandler<TState> handler, bool isInvokeRoute = false)
        {
            Selector = (_, _) => Task.FromResult(true);
            Handler = handler;
            IsInvokeRoute = isInvokeRoute;
        }

        public Route(RouteSelector selector, RouteHandler<TState> handler, bool isInvokeRoute = false)
        {
            Selector = selector;
            Handler = handler;
            IsInvokeRoute = isInvokeRoute;
        }

        public RouteSelector Selector { get; private set; }

        public RouteHandler<TState> Handler { get; private set; }

        public bool IsInvokeRoute { get; private set; }
    }
}
