using Microsoft.Bot.Builder;

namespace Microsoft.Teams.AI.AI.Action
{
    /// <summary>
    /// Attribute to represent the <see cref="ITurnContext"/> parameter of an action method.
    /// </summary>
    [AttributeUsage(AttributeTargets.Parameter, AllowMultiple = false)]
    public sealed class ActionTurnContextAttribute : ActionParameterAttribute
    {
        /// <summary>
        /// Create new <see cref="ActionTurnContextAttribute"/>.
        /// </summary>
        public ActionTurnContextAttribute() : base(ActionParameterType.TurnContext) { }
    }
}
