using AdaptiveCards;
using AdaptiveCards.Templating;
using Microsoft.Bot.Builder;
using Microsoft.Bot.Schema;
using Microsoft.Bot.Schema.Teams;
using Microsoft.Teams.AI;
using Microsoft.Teams.AI.State;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using SearchCommand.Model;
using System.Collections.Specialized;
using System.Web;

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
            int count = query?.QueryOptions?.Count ?? 10;
            Package[] packages = await SearchPackages(text, count, cancellationToken);

            // Format search results
            List<MessagingExtensionAttachment> attachments = packages.Select(package => new MessagingExtensionAttachment
            {
                ContentType = HeroCard.ContentType,
                Content = new HeroCard
                {
                    Title = package.Id,
                    Text = package.Description
                },
                Preview = new HeroCard
                {
                    Title = package.Id,
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
            // Generate detailed result
            CardPackage package = CardPackage.Create(query.ToObject<Package>()!);
            string cardTemplate = await File.ReadAllTextAsync(_packageCardFilePath, cancellationToken)!;
            string cardContent = new AdaptiveCardTemplate(cardTemplate).Expand(package);
            MessagingExtensionAttachment attachment = new()
            {
                ContentType = AdaptiveCard.ContentType,
                Content = JsonConvert.DeserializeObject(cardContent)
            };

            // Return results
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
            // Call NuGet Search API
            NameValueCollection query = HttpUtility.ParseQueryString(string.Empty);
            query["q"] = text;
            query["take"] = size.ToString();
            string queryString = query.ToString()!;
            string responseContent;
            try
            {
                responseContent = await _httpClient.GetStringAsync($"https://azuresearch-usnc.nuget.org/query?{queryString}", cancellationToken);
            }
            catch (Exception)
            {
                throw;
            }

            if (!string.IsNullOrWhiteSpace(responseContent))
            {
                JObject responseObj = JObject.Parse(responseContent);
                return responseObj["data"]?
                    .Select(obj => obj.ToObject<Package>()!)?
                    .ToArray() ?? Array.Empty<Package>();
            }
            else
            {
                return Array.Empty<Package>();
            }
        }
    }
}
