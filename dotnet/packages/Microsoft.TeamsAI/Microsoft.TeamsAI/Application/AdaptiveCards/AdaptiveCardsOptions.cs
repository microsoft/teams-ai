namespace Microsoft.Teams.AI
{
    /// <summary>
    /// Options for AdaptiveCards class.
    /// </summary>
    public class AdaptiveCardsOptions
    {
        /// <summary>
        /// Data field used to identify the Action.Submit handler to trigger.
        /// </summary>
        /// <remarks>
        /// When an Action.Submit is triggered, the field name specified here will be used to determine
        /// the handler to route the request to.
        /// Defaults to a value of "verb".
        /// </remarks>
        public string? ActionSubmitFilter { get; set; }
    }
}
