using Microsoft.Teams.AI.State;
using System.Runtime.CompilerServices;

// For Unit Testing
[assembly: InternalsVisibleTo("Microsoft.Teams.AI.Tests")]
namespace Microsoft.Teams.AI.AI.Action
{
    internal class ActionCollection<TState> : IActionCollection<TState> where TState : ITurnState<StateBase, StateBase, TempState>
    {
        private readonly Dictionary<string, ActionEntry<TState>> _actions;

        public ActionCollection()
        {
            _actions = new Dictionary<string, ActionEntry<TState>>();
        }

        /// <inheritdoc />
        public ActionEntry<TState> this[string actionName]
        {
            get
            {
                if (!_actions.ContainsKey(actionName))
                {
                    throw new ArgumentException($"`{actionName}` action does not exist");
                }
                return _actions[actionName];
            }
        }

        /// <inheritdoc />
        public void AddAction(string actionName, IActionHandler<TState> handler, bool allowOverrides = false)
        {
            if (_actions.ContainsKey(actionName))
            {
                if (!_actions[actionName].AllowOverrides)
                {
                    throw new ArgumentException($"Action {actionName} already exists and does not allow overrides");
                }
            }
            _actions[actionName] = new ActionEntry<TState>(actionName, handler, allowOverrides);
        }

        /// <inheritdoc />
        public bool ContainsAction(string actionName)
        {
            return _actions.ContainsKey(actionName);
        }

        public bool TryGetAction(string actionName, out ActionEntry<TState> actionEntry)
        {
            return _actions.TryGetValue(actionName, out actionEntry);
        }
    }
}
