namespace Microsoft.Teams.AI
{
    /// <summary>
    /// Options for TaskModules class.
    /// </summary>
    public class TaskModulesOptions
    {
        /// <summary>
        /// Data field to use to identify the verb of the handler to trigger.
        /// </summary>
        /// <remarks>
        ///  When a task module is triggered, the field name specified here will be used to determine
        /// the name of the verb for the handler to route the request to.
        /// Defaults to a value of "verb".
        /// </remarks>
        public string? TaskDataFilter { get; set; }
    }
}
