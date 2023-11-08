namespace Microsoft.Teams.AI.AI.Action
{
    /// <summary>
    /// Attribute to represent the action name parameter of an action method.
    /// </summary>
    [AttributeUsage(AttributeTargets.Parameter, AllowMultiple = false)]
    public sealed class ActionNameAttribute : ActionParameterAttribute
    {
        /// <summary>
        /// Create new <see cref="ActionNameAttribute"/>.
        /// </summary>
        public ActionNameAttribute() : base(ActionParameterType.Name) { }
    }
}
