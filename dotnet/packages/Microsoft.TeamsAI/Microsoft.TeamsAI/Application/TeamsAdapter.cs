using Microsoft.AspNetCore.Http;
using Microsoft.Copilot.BotBuilder;
using Microsoft.Copilot.Hosting.AspNetCore;
using Microsoft.Copilot.Protocols.Primitives;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System.Net.Http.Headers;
using System.Reflection;
using System.Security.Claims;

// Note: this class should never modify the way `CloudAdapter` is intended to work.

namespace Microsoft.Teams.AI
{
    /// <summary>
    /// An adapter that implements the Bot Framework Protocol and can be hosted in different cloud environments both public and private.
    /// </summary>
    public class TeamsAdapter : CloudAdapter
    {
        /// <summary>
        /// Initializes a new instance of the <see cref="TeamsAdapter"/> class.
        /// </summary>
        /// <param name="channelServiceClientFactory">The IChannelServiceClientFactory instance.</param>
        /// <param name="logger">The <see cref="ILogger"/> implementation this adapter should use.</param>
        public TeamsAdapter(
            IChannelServiceClientFactory channelServiceClientFactory,
            ILogger? logger = null) : base(
                channelServiceClientFactory,
                logger)
        {
            //HttpClientFactory = new TeamsHttpClientFactory(httpClientFactory);
            //Configuration = configuration;
            //CredentialsFactory = new ConfigurationServiceClientCredentialFactory(configuration);
        }

        /// <inheritdoc />
        public new async Task ProcessAsync(ClaimsIdentity claimsIdentity, HttpRequest httpRequest, HttpResponse httpResponse, IBot bot, CancellationToken cancellationToken = default)
        {
            //string version = Assembly.GetExecutingAssembly().GetName().Version.ToString();
            //ProductInfoHeaderValue productInfo = new("teamsai-dotnet", version);
            //httpResponse.Headers.Add("User-Agent", productInfo.ToString());
            await base.ProcessAsync(claimsIdentity, httpRequest, httpResponse, bot, cancellationToken);
        }
    }
}
