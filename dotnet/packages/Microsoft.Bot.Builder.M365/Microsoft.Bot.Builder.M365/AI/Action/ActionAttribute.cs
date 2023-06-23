
namespace Microsoft.Bot.Builder.M365.AI.Action
{
    [AttributeUsage(AttributeTargets.Method, AllowMultiple = false)]
    public class ActionAttribute : Attribute
    {
        /// <summary>
        /// The name of the action.
        /// </summary>
        public string Name { get; set; }
        
        /// <summary>
        /// Whether or not this action's properties can be overidden.
        /// </summary>
        public bool AllowOverrides { get; set; }

        public ActionAttribute(string name, bool allowOverrides = true)
        {
            Name = name;
            AllowOverrides = allowOverrides;
        }
    }
}
