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
        public ActionTurnStateAttribute() : base(ActionParameterType.TurnState) { }
    }
}
