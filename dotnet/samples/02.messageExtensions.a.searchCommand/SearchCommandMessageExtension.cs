using System.Collections.Specialized;
using System.Web;

using Microsoft.Bot.Builder;
using Microsoft.Bot.Schema.Teams;
using Microsoft.Bot.Schema;
using Microsoft.TeamsAI;
using Microsoft.TeamsAI.State;
using Newtonsoft.Json.Linq;

using SearchCommand.Card;
using Microsoft.Bot.Connector;
using AdaptiveCards.Templating;
using AdaptiveCards;
using Newtonsoft.Json;
using System.Net.Mail;

namespace SearchCommand
{
    public class SearchCommandMessageExtension : Application<TurnState, TurnStateManager>
    {
        private readonly HttpClient _httpClient;
        private readonly string _packageCardFilePath = Path.Combine(".", "Resources", "PackageCard.json");

        public SearchCommandMessageExtension(ApplicationOptions<TurnState, TurnStateManager> options, IHttpClientFactory httpClientFactory) : base(options)
        {
            _httpClient = httpClientFactory.CreateClient("WebClient");
        }

        protected override async Task<MessagingExtensionResponse> OnMessagingExtensionQueryAsync(MessagingExtensionQuery query, ITurnContext<IInvokeActivity> turnContext, TurnState turnState, CancellationToken cancellationToken)
        {
            string text = query?.Parameters?[0]?.Value as string ?? string.Empty;
            int count = query?.QueryOptions.Count ?? 10;
            Package[] packages = await SearchPackages(text, count, cancellationToken);

            // Format search results
            List<MessagingExtensionAttachment> attachments = packages.Select(package => new MessagingExtensionAttachment
            {
                ContentType = HeroCard.ContentType,
                Content = new HeroCard
                {
                    Title = package.Name,
                    Text = package.Description
                },
                Preview = new HeroCard
                {
                    Title = package.Name,
                    Text = package.Description,
                    Tap = new CardAction
                    {
                        Type = "invoke",
                        Value = package
                    }
                }.ToAttachment()
            }).ToList();

            // Return results as a list
            return new MessagingExtensionResponse
            {
                ComposeExtension = new MessagingExtensionResult
                {
                    Type = "result",
                    AttachmentLayout = "list",
                    Attachments = attachments
                }
            };
        }

        protected override async Task<MessagingExtensionResponse> OnMessagingExtensionSelectItemAsync(JObject query, ITurnContext<IInvokeActivity> turnContext, TurnState turnState, CancellationToken cancellationToken)
        {
            CardPackage package = CardPackage.Create(query.ToObject<Package>()!);
            string cardTemplate = await File.ReadAllTextAsync(_packageCardFilePath, cancellationToken)!;
            string cardContent = new AdaptiveCardTemplate(cardTemplate).Expand(package);

            MessagingExtensionAttachment attachment = new()
            {
                ContentType = AdaptiveCard.ContentType,
                Content = JsonConvert.DeserializeObject(cardContent)
            };

            return new MessagingExtensionResponse
            {
                ComposeExtension = new MessagingExtensionResult
                {
                    Type = "result",
                    AttachmentLayout = "list",
                    Attachments = new List<MessagingExtensionAttachment> { attachment }
                }
            };
        }

        private async Task<Package[]> SearchPackages(string text, int size, CancellationToken cancellationToken)
        {
            NameValueCollection query = HttpUtility.ParseQueryString(string.Empty);
            query["text"] = text;
            query["size"] = size.ToString();
            string queryString = query.ToString()!;
            string responseContent = await _httpClient.GetStringAsync($"http://registry.npmjs.com/-/v1/search?{queryString}", cancellationToken);
            JObject responseObj = JObject.Parse(responseContent);
            return responseObj["objects"]?
                .Select(obj => obj["package"]?.ToObject<Package>()!)?
                .ToArray() ?? Array.Empty<Package>();
        }
    }
}
