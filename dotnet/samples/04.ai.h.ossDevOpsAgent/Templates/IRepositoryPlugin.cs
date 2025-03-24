using Microsoft.Bot.Builder;
using Microsoft.SemanticKernel;
using System.ComponentModel;

namespace OSSDevOpsAgent.Templates
{
    public abstract class IRepositoryPlugin
    {
        public HttpClient HttpClient { get; set; }
        public ConfigOptions Config { get; set; }

        [KernelFunction, Description("Lists the pull requests")]
        public abstract Task<string> ListPRs(
           [Description("The turn context")] TurnContext context);
    }
}
