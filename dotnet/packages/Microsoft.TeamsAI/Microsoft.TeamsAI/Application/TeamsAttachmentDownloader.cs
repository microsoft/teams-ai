using Microsoft.Bot.Builder;
using Microsoft.Bot.Connector.Authentication;
using Microsoft.Bot.Schema;
using Microsoft.Rest;
using Microsoft.Teams.AI.State;
using Microsoft.Teams.AI.Utilities;
using Newtonsoft.Json.Linq;

namespace Microsoft.Teams.AI.Application
{
    /// <summary>
    /// Downloads attachments from Teams using the Bot access token.
    /// </summary>
    /// <typeparam name="TState"></typeparam>
    public class TeamsAttachmentDownloader<TState> : IInputFileDownloader<TState> where TState : TurnState, new()
    {
        private TeamsAttachmentDownloaderOptions _options;
        private HttpClient _httpClient;


        /// <summary>
        /// Creates the TeamsAttachmentDownloader
        /// </summary>
        /// <param name="options">The options</param>
        /// <param name="httpClient">Optional. The http client</param>
        /// <exception cref="ArgumentException"></exception>
        public TeamsAttachmentDownloader(TeamsAttachmentDownloaderOptions options, HttpClient? httpClient = null)
        {
            this._options = options;
            this._httpClient = httpClient ?? DefaultHttpClient.Instance;

            if (this._options.Adapter.CredentialsFactory == null)
            {
                throw new ArgumentException("The credentials factory is not set in the adapter");
            }
        }

        /// <inheritdoc />
        public async Task<List<InputFile>> DownloadFilesAsync(ITurnContext turnContext, TState turnState, CancellationToken cancellationToken = default)
        {
            // Filter out HTML attachments
            IEnumerable<Attachment> attachments = turnContext.Activity.Attachments.Where((a) => !a.ContentType.StartsWith("text/html"));
            if (!attachments.Any())
            {
                return new List<InputFile>();
            }

            string accessToken = "";

            bool authEnabled = !(await this._options.Adapter.CredentialsFactory!.IsAuthenticationDisabledAsync(cancellationToken));

            // If authentication is enabled, get access token
            if (authEnabled)
            {
                accessToken = await _GetAccessTokenAsync();
            }

            List<InputFile> files = new();

            foreach (Attachment attachment in attachments)
            {
                InputFile? file = await _DownloadFile(attachment, accessToken);
                if (file != null)
                {
                    files.Add(file);
                }
            }

            return files;
        }

        /// <summary>
        /// 
        /// </summary>
        /// <param name="attachment"></param>
        /// <param name="accessToken"></param>
        /// <returns></returns>
        private async Task<InputFile?> _DownloadFile(Attachment attachment, string accessToken)
        {
            if (attachment.ContentUrl != null && (attachment.ContentUrl.StartsWith("https://") || attachment.ContentUrl.StartsWith("http://localhost")))
            {
                // Get downloadable content link
                string? downloadUrl = (attachment.Content as JObject)?.Value<string>("downloadUrl");
                if (downloadUrl == null)
                {
                    downloadUrl = attachment.ContentUrl;
                }

                using (HttpRequestMessage request = new(HttpMethod.Get, downloadUrl))
                {
                    request.Headers.Add("Authorization", $"Bearer {accessToken}");

                    HttpResponseMessage response = await _httpClient.SendAsync(request).ConfigureAwait(false);

                    // Failed to download file
                    if (!response.IsSuccessStatusCode)
                    {
                        return null;
                    }

                    // Convert to a buffer
                    byte[] content = await response.Content.ReadAsByteArrayAsync();

                    // Fixup content type
                    string contentType = response.Content.Headers.ContentType.MediaType;
                    if (contentType.StartsWith("image/"))
                    {
                        contentType = "image/png";
                    }

                    return new InputFile(new BinaryData(content), contentType)
                    {
                        ContentUrl = attachment.ContentUrl,
                    };
                }
            }
            else
            {
                return new InputFile(new BinaryData(attachment.Content), attachment.ContentType)
                {
                    ContentUrl = attachment.ContentUrl,
                };
            }
        }


        private async Task<string> _GetAccessTokenAsync(CancellationToken cancellationToken = default)
        {
            // Normalize the ToChannelFromBotLoginUrlPrefix (and use a default value when it is undefined).
            // If non-public (specific tenant) login URL is to be used, make sure the full url including tenant ID is provided to TeamsAdapter on setup.
            string? toChannelFromBotLoginUrl = this._options.Adapter.Configuration?.GetSection("ToChannelFromBotLoginUrl")?.Value;
            if (toChannelFromBotLoginUrl == null)
            {
                toChannelFromBotLoginUrl = string.Format(AuthenticationConstants.ToChannelFromBotLoginUrlTemplate, AuthenticationConstants.DefaultChannelAuthTenant);
            }

            string? audience = this._options.Adapter.Configuration?.GetSection("ToChannelFromBotOAuthScope")?.Value;

            string ToChannelFromBotLoginUrlPrefix = "https://login.microsoftonline.com/";
            string ToChannelFromBotLoginUrlPrefixGov = "https://login.microsoftonline.us/";

            // If there is no toChannelFromBotLoginUrl set on the provided configuration, or it starts with 'https://login.microsoftonline.com/', the bot is operating in Public Azure.
            // So we use the Public Azure audience or the specified audience.
            if (toChannelFromBotLoginUrl.StartsWith(ToChannelFromBotLoginUrlPrefix))
            {
                audience ??= AuthenticationConstants.ToChannelFromBotOAuthScope;
            }
            else if (toChannelFromBotLoginUrl.StartsWith(ToChannelFromBotLoginUrlPrefixGov))
            {
                audience ??= GovernmentAuthenticationConstants.ToChannelFromBotOAuthScope;
            }

            ServiceClientCredentials appCreds = await this._options.Adapter.CredentialsFactory!.CreateCredentialsAsync(
                this._options.BotAppId,
                audience,
                toChannelFromBotLoginUrl,
                true,
                cancellationToken
            );

            return await ((AppCredentials)appCreds).GetTokenAsync();
        }
    }

    /// <summary>
    /// The TeamsAttachmentDownloader options
    /// </summary>
    public class TeamsAttachmentDownloaderOptions
    {
        /// <summary>
        /// The bot app id.
        /// </summary>
        public string BotAppId { get; set; } = string.Empty;

        /// <summary>
        /// The bot app password.
        /// </summary>
        public TeamsAdapter Adapter { get; set; }

        /// <summary>
        /// The constructor.
        /// </summary>
        /// <param name="botAppId">The bot's application id.</param>
        /// <param name="adapter">The teams adapter</param>
        public TeamsAttachmentDownloaderOptions(string botAppId, TeamsAdapter adapter)
        {
            BotAppId = botAppId;
            Adapter = adapter;
        }
    }
}
