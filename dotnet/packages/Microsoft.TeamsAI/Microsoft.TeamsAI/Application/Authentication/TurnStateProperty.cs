using Microsoft.Bot.Builder;
using Microsoft.Teams.AI.State;
using Microsoft.Teams.AI.Exceptions;

namespace Microsoft.Teams.AI
{
    internal class TurnStateProperty<TState> : IStatePropertyAccessor<TState>
        where TState : new()
    {
        private string _propertyName;
        private TurnStateEntry _state;

        public TurnStateProperty(TurnState state, string scopeName, string propertyName)
        {
            _propertyName = propertyName;

            TurnStateEntry? scope = state.GetScope(scopeName);
            if (scope == null)
            {
                throw new TeamsAIException($"TurnStateProperty: TurnState missing state scope named {scope}");
            }

            _state = scope;
        }

        public string Name => throw new NotImplementedException();

        public Task DeleteAsync(ITurnContext turnContext, CancellationToken cancellationToken = default)
        {
            _state.Value?.Remove(_propertyName);
            return Task.CompletedTask;
        }

        public Task<TState> GetAsync(ITurnContext turnContext, Func<TState>? defaultValueFactory = null, CancellationToken cancellationToken = default)
        {
            if (_state.Value != null)
            {
                if (_state.Value.TryGetValue(_propertyName, out TState result))
                {
                    return Task.FromResult(result);
                }
                else
                {
                    if (defaultValueFactory == null)
                    {
                        throw new ArgumentNullException(nameof(defaultValueFactory));
                    }
                    TState defaultValue = defaultValueFactory();
                    if (defaultValue == null)
                    {
                        throw new ArgumentNullException(nameof(defaultValue));
                    }
                    _state.Value[_propertyName] = defaultValue;
                    return Task.FromResult(defaultValue);
                }
            }

            throw new TeamsAIException("No state value available");
        }

        public Task SetAsync(ITurnContext turnContext, TState value, CancellationToken cancellationToken = default)
        {
            this._state.Value?.Set(_propertyName, value);
            return Task.CompletedTask;
        }
    }
}
