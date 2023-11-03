using Microsoft.Teams.AI.State;

namespace Microsoft.Teams.AI.AI.Action
{
    internal interface IActionCollection<TState> where TState : ITurnState<StateBase, StateBase, TempState>
    {
        /// <summary>
        /// Get an action from the collection.
        /// </summary>
        /// <param name="actionName">The name of the action.</param>
        /// <returns>The action entry in this collection.</returns>
        /// <exception cref="ArgumentException"></exception>
        ActionEntry<TState> this[string actionName] { get; }

        /// <summary>
        /// Add an action to the collection.
        /// </summary>
        /// <param name="actionName">The name of the action.</param>
        /// <param name="handler">The action handler.</param>
        /// <param name="allowOverrides">Whether or not this action's properties can be overridden. Default to false.</param>
        /// <exception cref="ArgumentException"></exception>
        void AddAction(string actionName, IActionHandler<TState> handler, bool allowOverrides = false);

        /// <summary>
        /// Checks if the action is in the collection.
        /// </summary>
        /// <param name="actionName">The name of the action.</param>
        /// <returns>Return true if the action exists. Otherwise false.</returns>
        bool ContainsAction(string actionName);

        /// <summary>
        /// Get an action from the collection.
        /// </summary>
        /// <param name="actionName">The name of the action.</param>
        /// <param name="actionEntry">The action entry in this collection.</param>
        /// <returns>true if this collection contains an action with the specified name; otherwise, false.</returns>
        bool TryGetAction(string actionName, out ActionEntry<TState> actionEntry);
    }
}
