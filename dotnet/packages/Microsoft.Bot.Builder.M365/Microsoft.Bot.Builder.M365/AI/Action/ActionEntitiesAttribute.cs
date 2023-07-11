namespace Microsoft.Bot.Builder.M365.AI.Action
{
    /// <summary>
    /// Attribute to represent the action entities parameter of an action method.
    /// </summary>
    [AttributeUsage(AttributeTargets.Parameter, AllowMultiple = false)]
    public sealed class ActionEntitiesAttribute : ActionParameterAttribute
    {
        /// <summary>
        /// Create new <see cref="ActionEntitiesAttribute"/>.
        /// </summary>
        public ActionEntitiesAttribute() : base(ActionParameterType.Entities) { }
    }
}
