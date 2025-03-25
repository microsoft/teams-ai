using Microsoft.Bot.Builder;
using Microsoft.Teams.AI;

namespace DevOpsAgent.Interfaces
{
    /// <summary>
    /// Defines the interface for a repository service.
    /// Manages all repository-related operations,
    /// including webhooks and plugins.
    /// </summary>
    public abstract class IRepositoryService
    {
        /// <summary>
        /// Used to retrieve previous convos for proactive notifications
        /// </summary>
        public MemoryStorage Storage { get; set; }

        // Used to send proactive notifications
        public TeamsAdapter Adapter { get; set; }

        /// <summary>
        /// The repository plugin used for this service.
        /// </summary>
        public IRepositoryPlugin RepositoryPlugin { get; set; }

        /// <summary>
        /// Handles the webhook events from the repository.
        /// </summary>
        /// <param name="payload">The incoming payload</param>
        /// <param name="cancellationToken">Cancellation token</param>
        /// <param name="request">The incoming request</param>
        /// <param name="response">The outgoing response</param>
        /// <returns></returns>
        public abstract Task HandleWebhook(dynamic payload, CancellationToken cancellationToken, HttpRequest request, HttpResponse response);
    }
}
