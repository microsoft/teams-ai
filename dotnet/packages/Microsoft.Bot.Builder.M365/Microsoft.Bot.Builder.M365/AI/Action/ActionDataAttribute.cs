namespace Microsoft.Bot.Builder.M365.AI.Action
{
    /// <summary>
    /// Attribute to represent the action data parameter of an action method.
    /// </summary>
    [AttributeUsage(AttributeTargets.Parameter, AllowMultiple = false)]
    public sealed class ActionDataAttribute : ActionParameterAttribute
    {
        /// <summary>
        /// Create new <see cref="ActionDataAttribute"/>.
        /// </summary>
        /// <param name="type">The type of action data.</param>
        public ActionDataAttribute(Type type) : base(ActionParameterType.Data, type) { }
    }
}
