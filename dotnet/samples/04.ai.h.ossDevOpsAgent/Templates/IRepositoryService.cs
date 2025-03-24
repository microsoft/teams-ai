using Microsoft.Bot.Builder;
using Microsoft.Teams.AI;

namespace OSSDevOpsAgent.Templates
{
    /// <summary>
    /// Defines the interface for a repository service.
    /// Manages all repository-related operations,
    /// including webhooks and plugins.
    /// </summary>
    public abstract class IRepositoryService
    {

        public MemoryStorage Storage { get; set; }

        public TeamsAdapter Adapter { get; set; }

        public IRepositoryPlugin RepositoryPlugin { get; set; }

        public abstract Task HandleWebhook(dynamic payload, CancellationToken cancellationToken, HttpRequest request, HttpResponse response);
    }
}
