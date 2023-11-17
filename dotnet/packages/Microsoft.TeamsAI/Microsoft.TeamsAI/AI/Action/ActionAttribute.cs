
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
        /// Whether this action is default.
        /// </summary>
        public bool IsDefault { get; private set; }

        /// <summary>
        /// Creates a new instance of the <see cref="ActionAttribute"/> class.
        /// </summary>
        /// <param name="name">The name of the action.</param>
        /// <param name="isDefault">Whether this action is default.</param>
        public ActionAttribute(string name, bool isDefault = false)
        {
            Name = name;
            IsDefault = isDefault;
        }
    }
}
