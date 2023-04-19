using System.Reflection;

namespace Microsoft.Bot.Builder.M365.AI.Action
{
    public class ActionEntry<TState> where TState : TurnState
    {
        /// <summary>
        /// The name of the action.
        /// </summary>
        public string Name { get; set; }

        /// <summary>
        /// The action handler function.
        /// </summary>
        public ActionHandler<TState> Handler { get; set; }
        public bool AllowOverrides { get; set; }

        public ActionEntry(string name, ActionHandler<TState> handler, bool allowOverrides = true)
        {
            Name = name;
            Handler = handler;
            AllowOverrides = allowOverrides;
        }

        /// <summary>
        /// Converts a method with the <see cref="ActionAttribute"/> to an <see cref="ActionEntry{TState}"/>.
        /// </summary>
        /// <param name="methodSignature">The method signature.</param>
        /// <param name="methodContainerInstance">The instance of a class which contains the method.</param>
        /// <returns>
        /// The <see cref="ActionEntry{TState}"/> if the given method adheres to the <see cref="ActionHandler{TState}"/> delegate
        /// and has the <see cref="ActionAttribute"/>. Otherwise, returns null.
        /// </returns>
        /// <exception cref="Exception"></exception>
        public static ActionEntry<TState>? FromNativeMethod(MethodInfo methodSignature, object methodContainerInstance)
        {
            if (methodSignature == null)
            { 
                throw new Exception("Method is null");
            }

            if (methodContainerInstance == null)
            {
                throw new Exception("Method container instance is null");
            } 

            ActionAttribute? actionAttribute = methodSignature
                .GetCustomAttributes(typeof(ActionAttribute), true)
                .Cast<ActionAttribute>()
                .FirstOrDefault();

            if (actionAttribute == null) 
            {
                return null;
            }

            string name = actionAttribute.Name;
            ActionHandler<TState>? handler = Delegate.CreateDelegate(typeof(ActionHandler<TState>), methodContainerInstance, methodSignature, false) as ActionHandler<TState>;
            bool allowOverrides = actionAttribute.AllowOverrides;

            if (handler == null)
            {
                throw new Exception("Action handler method has an incorrect type signature");
            }
            
            return new ActionEntry<TState>(name, handler, allowOverrides);
        }
    }
}
