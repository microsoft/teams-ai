using Microsoft.Bot.Builder;
using Microsoft.Teams.AI.State;

namespace Microsoft.Teams.AI.AI.Planners
{
    /// <summary>
    /// A planner is responsible for generating a plan that the AI system will execute.
    /// </summary>
    public interface IPlanner<TState> where TState : TurnState
    {
        /// <summary>
        /// Starts a new task.
        /// </summary>
        /// <remarks>
        /// This method is called when the AI system is ready to start a new task. The planner should
        /// generate a plan that the AI system will execute. Returning an empty plan signals that
        /// there is no work to be performed.
        ///
        /// The planner should take the users input from `state.temp.input`.
        /// </remarks>
        /// <param name="turnContext">Context for the current turn of conversation</param>
        /// <param name="turnState">Application state for the current turn of conversation</param>
        /// <param name="ai">The AI system that is generating the plan.</param>
        /// <param name="cancellationToken">A cancellation token that can be used by other objects
        /// or threads to receive notice of cancellation.</param>
        /// <returns>The plan that was generated.</returns>
        Task<Plan> BeginTaskAsync(ITurnContext turnContext, TState turnState, AI<TState> ai, CancellationToken cancellationToken = default);

        /// <summary>
        /// Continues the current task.
        /// </summary>
        /// <remarks>
        /// This method is called when the AI system has finished executing the previous plan and is
        /// ready to continue the current task. The planner should generate a plan that the AI system
        /// will execute. Returning an empty plan signals that the task is completed and there is no work
        /// to be performed.
        ///
        /// The output from the last plan step that was executed is passed to the planner via `state.temp.input`.
        /// </remarks>
        /// <param name="turnContext">Context for the current turn of conversation</param>
        /// <param name="turnState">Application state for the current turn of conversation</param>
        /// <param name="ai">The AI system that is generating the plan.</param>
        /// <param name="cancellationToken">A cancellation token that can be used by other objects
        /// or threads to receive notice of cancellation.</param>
        /// <returns>The plan that was generated.</returns>
        Task<Plan> ContinueTaskAsync(ITurnContext turnContext, TState turnState, AI<TState> ai, CancellationToken cancellationToken = default);
    }
}
