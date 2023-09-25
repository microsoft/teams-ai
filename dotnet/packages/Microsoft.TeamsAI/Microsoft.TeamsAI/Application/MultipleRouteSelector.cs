using System.Text.RegularExpressions;

namespace Microsoft.TeamsAI.Application
{
    /// <summary>
    /// Combination of String, Regex, and RouteSelector selectors.
    /// </summary>
    public class MultipleRouteSelector
    {
        /// <summary>
        /// The string selectors.
        /// </summary>
        public string[]? Strings { get; set; }

        /// <summary>
        /// The Regex selectors.
        /// </summary>
        public Regex[]? Regexes { get; set; }

        /// <summary>
        /// The RouteSelector function selectors. 
        /// </summary>
        public RouteSelector[]? RouteSelectors { get; set; }
    }
}
