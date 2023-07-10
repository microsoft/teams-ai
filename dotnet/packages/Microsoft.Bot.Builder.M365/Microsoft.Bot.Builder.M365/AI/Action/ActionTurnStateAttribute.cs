namespace Microsoft.Bot.Builder.M365.AI.Action
{
    /// <summary>
    /// Attribute to represent the <see cref="TurnState"/> parameter of an action method.
    /// </summary>
    [AttributeUsage(AttributeTargets.Parameter, AllowMultiple = false)]
    public sealed class ActionTurnStateAttribute : ActionParameterAttribute
    {
        /// <summary>
        /// Create new <see cref="ActionTurnStateAttribute"/>.
        /// </summary>
        /// <param name="type">The actual type of <see cref="TurnState"/> parameter in action method.</param>
        /// <exception cref="Exception">Throws if the input type is not a <see cref="TurnState"/>.</exception>
        public ActionTurnStateAttribute(Type type) : base(ActionParameterType.TurnState, type)
        {
            if (!typeof(TurnState).IsAssignableFrom(type))
            {
                throw new Exception("ActionTurnStateAttribute input type should be a TurnState");
            }
        }
    }
}
