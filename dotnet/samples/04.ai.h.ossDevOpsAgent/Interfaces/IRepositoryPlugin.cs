using Microsoft.Bot.Builder;
using Microsoft.SemanticKernel;
using System.ComponentModel;

namespace DevOpsAgent.Interfaces
{
    /// <summary>
    /// Defines the interface for a repository plugin.
    /// </summary>
    public abstract class IRepositoryPlugin
    {
        /// <summary>
        /// The HTTP client used for making API requests
        /// </summary>
        public HttpClient HttpClient { get; set; }
        /// <summary>
        /// Provides access to keys for auth
        /// </summary>
        public ConfigOptions Config { get; set; }

        /// <summary>
        /// Lists the pull requests for the repository
        /// </summary>
        /// <param name="context">The turn context</param>
        /// <returns>A serialized adaptive card of the pull requests</returns>
        [KernelFunction, Description("Lists the pull requests")]
        public abstract Task<string> ListPRs(
           [Description("The turn context")] TurnContext context);
    }
}
