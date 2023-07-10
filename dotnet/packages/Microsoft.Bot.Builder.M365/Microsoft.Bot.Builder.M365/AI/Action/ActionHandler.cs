using System.Reflection;

namespace Microsoft.Bot.Builder.M365.AI.Action
{
    internal sealed class ActionHandlerx<TState> : IActionHandler<TState> where TState : TurnState
    {
        private readonly MethodInfo _method;

        private object _containerInstance;

        private ActionParameterAttribute[] _parameterTypes;

        private Type _returnType;

        internal ActionHandlerx(MethodInfo method, object containerInstance) {
            _method = method;
            _containerInstance = containerInstance;

            _returnType = _method.ReturnType;
            if (_returnType != typeof(void)
                || _returnType != typeof(bool)
                || _returnType != typeof(Task)
                || _returnType != typeof(Task<bool>)
                || _returnType != typeof(ValueTask)
                || _returnType != typeof(ValueTask<bool>))
            {
                throw new Exception($"Action method return type should be one of [void, bool, Task, Task<bool>, ValueTask, ValueTask<bool>]. Method name: {_method.Name}.");
            }

            ParameterInfo[] parameters = _method.GetParameters();
            List<ActionParameterAttribute> parameterTypes = new();
            foreach (ParameterInfo parameter in parameters)
            {
                IEnumerable<ActionParameterAttribute> parameterAttributes = parameter.GetCustomAttributes(typeof(ActionParameterAttribute), true).Cast<ActionParameterAttribute>();
                ActionParameterAttribute parameterAttribute = parameterAttributes.FirstOrDefault();
                if (parameterAttribute == null)
                {
                    parameterTypes.Add(new ActionParameterAttribute(ActionParameterType.Unknown, parameter.ParameterType));
                }
                else if (parameterAttributes.Count() > 1)
                {
                    throw new Exception($"Action method parameter should have no more than one parameter attribute. Method name: {_method.Name}. Parameter name: {parameter.Name}.");
                }
                else
                {
                    if (parameterAttribute.Type != null)
                    {
                        CheckParameterAssignment(_method, parameterAttribute.Type, parameter.ParameterType);
                    }
                    parameterTypes.Add(parameterAttribute);
                }
            }
            _parameterTypes = parameterTypes.ToArray();
        }

        public async Task<bool> PerformAction(ITurnContext turnContext, TState turnState, object? entities = null, string? action = null)
        {
            List<object?> parameters = new();
            foreach (ActionParameterAttribute parameterType in _parameterTypes)
            {
                switch (parameterType.ActionParameterType)
                {
                    case ActionParameterType.TurnContext:
                        CheckParameterAssignment(_method, turnContext.GetType(), parameterType.Type!);
                        parameters.Add(turnContext);
                        break;
                    case ActionParameterType.TurnState:
                        CheckParameterAssignment(_method, turnState.GetType(), parameterType.Type!);
                        parameters.Add(turnState);
                        break;
                    case ActionParameterType.Entities:
                        if (entities != null)
                        {
                            CheckParameterAssignment(_method, entities.GetType(), parameterType.Type!);
                        }
                        parameters.Add(entities);
                        break;
                    case ActionParameterType.Name:
                        if (action != null)
                        {
                            CheckParameterAssignment(_method, action.GetType(), parameterType.Type!);
                        }
                        parameters.Add(action);
                        break;
                    case ActionParameterType.Unknown:
                    default:
                        parameters.Add(parameterType.Type == null ? null : parameterType.Type.IsValueType ? Activator.CreateInstance(parameterType.Type) : null);
                        break;
                }
            }

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
                throw new Exception($"Action method return type should be one of [void, bool, Task, Task<bool>, ValueTask, ValueTask<bool>]. Method name: {_method.Name}.");
            }
        }

        private static void CheckParameterAssignment(MethodInfo method, Type from, Type to)
        {
            if (!to.IsAssignableFrom(from))
            {
                throw new Exception($"Cannot assign {from} to {to} of action method {method.Name}");
            }
        }
    }
}
