
namespace Microsoft.Teams.AI.AI.Action
{
    /// <summary>
    /// Attribute that marks a method as an action.
    /// </summary>
    [AttributeUsage(AttributeTargets.Method, AllowMultiple = false)]
    public sealed class ActionAttribute : Attribute
    {
        /// <summary>
        /// The name of the action.
        /// </summary>
        public string Name { get; private set; }

        /// <summary>
        /// Whether or not this action's properties can be overridden.
        /// </summary>
        public bool AllowOverrides { get; private set; }

        /// <summary>
        /// Creates a new instance of the <see cref="ActionAttribute"/> class.
        /// </summary>
        /// <param name="name">The name of the action.</param>
        /// <param name="allowOverrides">Whether this action can override an existing one.</param>
        public ActionAttribute(string name, bool allowOverrides = true)
        {
            Name = name;
            AllowOverrides = allowOverrides;
        }
    }
}
