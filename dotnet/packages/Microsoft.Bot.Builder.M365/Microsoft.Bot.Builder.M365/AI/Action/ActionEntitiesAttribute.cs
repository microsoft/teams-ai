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
        /// <param name="type">The type of action data.</param>
        public ActionEntitiesAttribute(Type type) : base(ActionParameterType.Entities, type)
        {
            if (type == null)
            {
                throw new ArgumentNullException("type", "ActionEntities attribute input type should not be null.");
            }
        }
    }
}
