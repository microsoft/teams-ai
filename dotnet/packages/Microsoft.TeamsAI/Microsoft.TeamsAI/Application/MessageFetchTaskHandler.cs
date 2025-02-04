using Microsoft.Bot.Builder;
using Microsoft.Bot.Schema.Teams;
using Microsoft.Teams.AI.State;

namespace Microsoft.Teams.AI.Application
{
    /// <summary>
    /// Function for handling message task fetch events.
    /// </summary>
    /// <typeparam name="TState">Type of the turn state. This allows for strongly typed access to the turn state.</typeparam>
    /// <param name="turnContext">A strongly-typed context object for this turn.</param>
    /// <param name="turnState">The turn state object that stores arbitrary data for this turn.</param>
    /// <param name="data">The data associated with the fetch.</param>
    /// <param name="cancellationToken">A cancellation token that can be used by other objects or threads to receive notice of cancellation.</param>
    /// <returns>An instance of TaskModuleTaskInfo.</returns>
    public delegate Task<MessageFetchTaskResponse> MessageFetchTaskHandler<TState>(ITurnContext turnContext, TState turnState, object data, CancellationToken cancellationToken) where TState : TurnState;

    /// <summary>
    /// Response for the "message/taskFetch" route handler. Only set one or the other, but not both.
    /// </summary>
    public class MessageFetchTaskResponse
    {
        /// <summary>
        /// The task module metadata.
        /// </summary>
        public TaskModuleTaskInfo? TaskInfo;

        /// <summary>
        /// The message to show in the task module.
        /// </summary>
        public string? Message;
    }
}