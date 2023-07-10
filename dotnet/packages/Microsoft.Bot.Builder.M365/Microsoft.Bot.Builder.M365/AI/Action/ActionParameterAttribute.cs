namespace Microsoft.Bot.Builder.M365.AI.Action
{
    public class ActionParameterAttribute : Attribute
    {
        /// <summary>
        /// The attribute type that represents what the action parameter is.
        /// </summary>
        internal ActionParameterType ActionParameterType { get; set; }

        /// <summary>
        /// The real data type.
        /// </summary>
        internal Type? Type { get; set; }

        internal ActionParameterAttribute(ActionParameterType actionParameterType, Type? type)
        {
            ActionParameterType = actionParameterType;
            Type = type;
        }
    }

    /// <summary>
    /// Represent what the action parameter is.
    /// </summary>
    internal enum ActionParameterType
    {
        /// <summary>
        /// The action parameter is TurnContext
        /// </summary>
        TurnContext,
        /// <summary>
        /// The action parameter is TurnState
        /// </summary>
        TurnState,
        /// <summary>
        /// The action parameter is data object
        /// </summary>
        Data,
        /// <summary>
        /// The action parameter is action name
        /// </summary>
        Name,
        /// <summary>
        /// The action parameter is not attributed, use default value
        /// </summary>
        Unknown,
    }
}
