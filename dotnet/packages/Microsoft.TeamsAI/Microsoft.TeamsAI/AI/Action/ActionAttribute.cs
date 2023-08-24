
namespace Microsoft.TeamsAI.AI.Action
{
    [AttributeUsage(AttributeTargets.Method, AllowMultiple = false)]
    public sealed class ActionAttribute : Attribute
    {
        /// <summary>
        /// The name of the action.
        /// </summary>
        public string Name { get; private set; }

        /// <summary>
        /// Whether or not this action's properties can be overidden.
        /// </summary>
        public bool AllowOverrides { get; private set; }

        public ActionAttribute(string name, bool allowOverrides = true)
        {
            Name = name;
            AllowOverrides = allowOverrides;
        }
    }
}
