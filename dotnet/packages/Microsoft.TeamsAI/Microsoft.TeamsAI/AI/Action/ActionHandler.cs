using System.Reflection;
using Microsoft.Bot.Builder;
using Microsoft.Teams.AI.State;

namespace Microsoft.Teams.AI.AI.Action
{
    // TODO: add analyzer to show type warning at compile time.
    /// <summary>
    /// The action handler built from method.
    /// </summary>
    /// <typeparam name="TState">Type of the turn state</typeparam>
    internal sealed class ActionHandler<TState> : IActionHandler<TState> where TState : ITurnState<StateBase, StateBase, TempState>
    {
        private readonly MethodInfo _method;

        private object _containerInstance;

        private Tuple<ActionParameterType, Type>[] _parameterTypes;

        private Type _returnType;

        internal ActionHandler(MethodInfo method, object containerInstance)
        {
            _method = method;
            _containerInstance = containerInstance;

            _returnType = _method.ReturnType;
            if (_returnType != typeof(void)
                && _returnType != typeof(bool)
                && _returnType != typeof(Task)
                && _returnType != typeof(Task<bool>)
                && _returnType != typeof(ValueTask)
                && _returnType != typeof(ValueTask<bool>))
            {
                throw new InvalidOperationException($"Action method return type should be one of [void, bool, Task, Task<bool>, ValueTask, ValueTask<bool>]. Method name: {_method.Name}.");
            }

            ParameterInfo[] parameters = _method.GetParameters();
            List<Tuple<ActionParameterType, Type>> parameterTypes = new();
            foreach (ParameterInfo parameter in parameters)
            {
                IEnumerable<ActionParameterAttribute> parameterAttributes = parameter.GetCustomAttributes(typeof(ActionParameterAttribute), true).Cast<ActionParameterAttribute>();
                ActionParameterAttribute parameterAttribute = parameterAttributes.FirstOrDefault();
                if (parameterAttribute == null)
                {
                    parameterTypes.Add(Tuple.Create(ActionParameterType.Unknown, parameter.ParameterType));
                }
                else if (parameterAttributes.Count() > 1)
                {
                    throw new InvalidOperationException($"Action method parameter should have no more than one parameter attribute. Method name: {_method.Name}. Parameter name: {parameter.Name}.");
                }
                else
                {
                    parameterTypes.Add(Tuple.Create(parameterAttribute.ActionParameterType, parameter.ParameterType));
                }
            }
            _parameterTypes = parameterTypes.ToArray();
        }

        public async Task<bool> PerformAction(ITurnContext turnContext, TState turnState, object? entities = null, string? action = null)
        {
            List<object?> parameters = new();
            foreach (Tuple<ActionParameterType, Type> parameterType in _parameterTypes)
            {
                switch (parameterType.Item1)
                {
                    case ActionParameterType.TurnContext:
                        CheckParameterAssignment(_method, turnContext.GetType(), parameterType.Item2!);
                        parameters.Add(turnContext);
                        break;
                    case ActionParameterType.TurnState:
                        CheckParameterAssignment(_method, turnState.GetType(), parameterType.Item2!);
                        parameters.Add(turnState);
                        break;
                    case ActionParameterType.Entities:
                        if (entities != null)
                        {
                            CheckParameterAssignment(_method, entities.GetType(), parameterType.Item2!);
                        }
                        parameters.Add(entities);
                        break;
                    case ActionParameterType.Name:
                        if (action != null)
                        {
                            CheckParameterAssignment(_method, action.GetType(), parameterType.Item2!);
                        }
                        parameters.Add(action);
                        break;
                    case ActionParameterType.Unknown:
                    default:
                        parameters.Add(parameterType.Item2 == null ? null : parameterType.Item2.IsValueType ? Activator.CreateInstance(parameterType.Item2) : null);
                        break;
                }
            }

            try
            {
                object result = _method.Invoke(_containerInstance, parameters.ToArray());
                if (_returnType == typeof(void))
                {
                    return true;
                }
                else if (_returnType == typeof(bool))
                {
                    return (bool)result;
                }
                else if (_returnType == typeof(Task))
                {
                    await ((Task)result).ConfigureAwait(false);
                    return true;
                }
                else if (_returnType == typeof(Task<bool>))
                {
                    return await ((Task<bool>)result).ConfigureAwait(false);
                }
                else if (_returnType == typeof(ValueTask))
                {
                    await ((ValueTask)result).ConfigureAwait(false);
                    return true;
                }
                else if (_returnType == typeof(ValueTask<bool>))
                {
                    return await ((ValueTask<bool>)result).ConfigureAwait(false);
                }
                else
                {
                    throw new InvalidOperationException($"Action method return type should be one of [void, bool, Task, Task<bool>, ValueTask, ValueTask<bool>]. Method name: {_method.Name}.");
                }
            }
            catch (TargetInvocationException ex)
            {
                if (ex.InnerException != null)
                {
                    throw ex.InnerException;
                }
                else
                {
                    throw;
                }
            }
        }

        private static void CheckParameterAssignment(MethodInfo method, Type from, Type to)
        {
            if (!to.IsAssignableFrom(from))
            {
                throw new InvalidOperationException($"Cannot assign {from} to {to} of action method {method.Name}");
            }
        }
    }
}
