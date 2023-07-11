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
        public IActionHandler<TState> Handler { get; set; }

        /// <summary>
        /// Whether to allow overrides of this action's properties.
        /// </summary>
        public bool AllowOverrides { get; set; }

        public ActionEntry(string name, IActionHandler<TState> handler, bool allowOverrides = true)
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
            IActionHandler<TState> handler = new ActionHandler<TState>(methodSignature, methodContainerInstance);
            bool allowOverrides = actionAttribute.AllowOverrides;

            return new ActionEntry<TState>(name, handler, allowOverrides);
        }
    }
}
