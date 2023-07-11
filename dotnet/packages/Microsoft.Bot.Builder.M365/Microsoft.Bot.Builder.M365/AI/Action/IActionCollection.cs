﻿using Microsoft.Bot.Builder.M365.State;

namespace Microsoft.Bot.Builder.M365.AI.Action
{
    // TODO: Support different delegate types
    public delegate Task<bool> ActionHandler<TState>(ITurnContext turnContext, TState turnState, object? entities = null, string? action = null) where TState : ITurnState<StateBase, StateBase, TempState>;

    public interface IActionCollection<TState> where TState : ITurnState<StateBase, StateBase, TempState>
    {
        /// <summary>
        /// Set an action in the collection.
        /// </summary>
        /// <param name="name">The name of the action.</param>
        /// <param name="handler">The action handler function.</param>
        /// <param name="allowOverrides">Whether or not this action's properties can be overriden.</param>
        /// <exception cref="ArgumentException"></exception>
        void SetAction(string actionName, ActionHandler<TState> actionEntry, bool allowOverrides);

        /// <summary>
        /// Get an action from the collection.
        /// </summary>
        /// <param name="name">The name of the action.</param>
        /// <returns>The action entry in this collection.</returns>
        /// <exception cref="ArgumentException"></exception>
        ActionEntry<TState> GetAction(string actionName);
        
        /// <summary>
        /// Checks if the action is in the collection.
        /// </summary>
        /// <param name="actionName">The name of the action.</param>
        /// <returns>Return true if the action exists. Otherwise false.</returns>
        bool HasAction(string actionName);
    }
}
