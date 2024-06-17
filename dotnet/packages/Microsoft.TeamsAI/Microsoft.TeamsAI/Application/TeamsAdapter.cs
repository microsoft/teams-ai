using Microsoft.AspNetCore.Http;
using Microsoft.Bot.Builder;
using Microsoft.Bot.Builder.Integration.AspNet.Core;
using Microsoft.Bot.Connector.Authentication;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System.Net.Http.Headers;
using System.Reflection;

// Note: this class should never modify the way `CloudAdapter` is intended to work.

namespace Microsoft.Teams.AI
{
    /// <summary>
    /// An adapter that implements the Bot Framework Protocol and can be hosted in different cloud environments both public and private.
    /// </summary>
    public class TeamsAdapter : CloudAdapter
    {
        /// <summary>
        /// The Http Client Factory
        /// </summary>
        public IHttpClientFactory HttpClientFactory { get; }

        /// <summary>
        /// The Configuration
        /// </summary>
        internal IConfiguration? Configuration { get; }

        /// <summary>
        /// The Service Client Credentials Factory
        /// </summary>
        internal ServiceClientCredentialsFactory? CredentialsFactory { get; }

        /// <summary>
        /// Initializes a new instance of the <see cref="TeamsAdapter"/> class. (Public cloud. No auth. For testing.)
        /// </summary>
        public TeamsAdapter() : base()
        {
            HttpClientFactory = new TeamsHttpClientFactory();
        }

        /// <summary>
        /// Initializes a new instance of the <see cref="TeamsAdapter"/> class.
        /// </summary>
        /// <param name="configuration">The <see cref="IConfiguration"/> instance.</param>
        /// <param name="httpClientFactory">The <see cref="IHttpClientFactory"/> this adapter should use.</param>
        /// <param name="logger">The <see cref="ILogger"/> implementation this adapter should use.</param>
        public TeamsAdapter(
            IConfiguration configuration,
            IHttpClientFactory? httpClientFactory = null,
            ILogger? logger = null) : base(
                configuration,
                new TeamsHttpClientFactory(httpClientFactory),
                logger)
        {
            HttpClientFactory = new TeamsHttpClientFactory(httpClientFactory);
            Configuration = configuration;
            CredentialsFactory = new ConfigurationServiceClientCredentialFactory(configuration);
        }

        /// <inheritdoc />
        public new async Task ProcessAsync(HttpRequest httpRequest, HttpResponse httpResponse, IBot bot, CancellationToken cancellationToken = default)
        {
            string version = Assembly.GetExecutingAssembly().GetName().Version.ToString();
            ProductInfoHeaderValue productInfo = new("teamsai-dotnet", version);
            httpResponse.Headers.Add("User-Agent", productInfo.ToString());
            await base.ProcessAsync(httpRequest, httpResponse, bot, cancellationToken);
        }
    }

    internal class TeamsHttpClientFactory : IHttpClientFactory
    {
        private readonly IHttpClientFactory? _parent;

        public TeamsHttpClientFactory(IHttpClientFactory? parent = null)
        {
            _parent = parent;
        }

        public HttpClient CreateClient(string name)
        {
            HttpClient client = _parent != null ? _parent.CreateClient(name) : new();
            string version = Assembly.GetExecutingAssembly().GetName().Version.ToString();
            ProductInfoHeaderValue productInfo = new("teamsai-dotnet", version);

            if (!client.DefaultRequestHeaders.UserAgent.Contains(productInfo))
            {
                client.DefaultRequestHeaders.UserAgent.Add(productInfo);
            }

            return client;
        }
    }
}
