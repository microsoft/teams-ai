using Microsoft.Bot.Builder;
using Microsoft.TeamsAI;
using Microsoft.TeamsAI.State;
using Microsoft.Bot.Schema;
using Newtonsoft.Json.Linq;
using System.Collections.Specialized;
using System.Web;
using TypeAheadBot.Model;
using Newtonsoft.Json;

namespace TypeAheadBot
{
    public class TypeAheadBotApplication : Application<TurnState, TurnStateManager>
    {
        private readonly string _staticSearchCardFilePath = Path.Combine(".", "Resources", "StaticSearchCard.json");
        private readonly string _dynamicSearchCardFilePath = Path.Combine(".", "Resources", "DynamicSearchCard.json");

        private readonly HttpClient _httpClient;

        public TypeAheadBotApplication(ApplicationOptions<TurnState, TurnStateManager> options, IHttpClientFactory httpClientFactory) : base(options) 
        {
            _httpClient = httpClientFactory.CreateClient("WebClient");
        }

        protected override async Task OnMembersAddedAsync(IList<ChannelAccount> membersAdded, ITurnContext<IConversationUpdateActivity> turnContext, TurnState turnState, CancellationToken cancellationToken)
        {
            foreach (ChannelAccount member in membersAdded)
            {
                if (member.Id != turnContext.Activity.Recipient.Id)
                {
                    await turnContext.SendActivityAsync(MessageFactory.Text("Hello and welcome! With this sample you can see the functionality of static and dynamic search in adaptive card"), cancellationToken);
                }
            }
        }

        protected override async Task OnMessageActivityAsync(ITurnContext<IMessageActivity> turnContext, TurnState turnState, CancellationToken cancellationToken)
        {
            if (turnContext.Activity.Type == ActivityTypes.Message)
            {
                if (turnContext.Activity.Text != null)
                {
                    if (turnContext.Activity.Text.Equals("static", StringComparison.OrdinalIgnoreCase))
                    {
                        Attachment attachment = CreateAdaptiveCardAttachment(_staticSearchCardFilePath);
                        await turnContext.SendActivityAsync(MessageFactory.Attachment(attachment), cancellationToken);
                    }
                    else if (turnContext.Activity.Text.Equals("dynamic", StringComparison.OrdinalIgnoreCase))
                    {
                        Attachment attachment = CreateAdaptiveCardAttachment(_dynamicSearchCardFilePath);
                        await turnContext.SendActivityAsync(MessageFactory.Attachment(attachment), cancellationToken);
                    }
                    else
                    {
                        await turnContext.SendActivityAsync(MessageFactory.Text("Try saying \"static\" or \"dynamic\"."), cancellationToken);
                    }
                }
                else if (turnContext.Activity.Value != null)
                {
                    // handling Adaptive Card Action.Submit events
                    AdaptiveCardSubmitResult submitResult = (turnContext.Activity.Value! as JObject).ToObject<AdaptiveCardSubmitResult>();
                    if (submitResult.Verb.Equals("StaticSubmit"))
                    {
                        await turnContext.SendActivityAsync(MessageFactory.Text($"Statically selected option is: {submitResult.ChoiceSelect}"), cancellationToken);
                    }
                    else if (submitResult.Verb.Equals("DynamicSubmit"))
                    {
                        await turnContext.SendActivityAsync(MessageFactory.Text($"Dynamically selected option is: {submitResult.ChoiceSelect}"), cancellationToken);
                    }
                }
            }
        }

        protected override async Task<SearchInvokeResponse> OnSearchInvokeAsync(SearchInvokeValue invokeValue, ITurnContext<IInvokeActivity> turnContext, TurnState turnState, CancellationToken cancellationToken)
        {
            string queryText = invokeValue.QueryText;
            int count = invokeValue.QueryOptions.Top;

            Package[] packages = await SearchPackages(queryText, count, cancellationToken);
            
            IList<AdaptiveCardSearchResult> searchResults = packages.Select(package => new AdaptiveCardSearchResult()
            {
                Title = package.Id,
                Value = $"{package.Id} - {package.Description}"
            }).ToList();
            SearchInvokeResponse response = new SearchInvokeResponse()
            {
                StatusCode = 200,
                Type = "application/vnd.microsoft.search.searchResponse",
                Value = new
                {
                    results = searchResults
                }
            };

            return response;
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

        private static Attachment CreateAdaptiveCardAttachment(string filePath)
        {
            var adaptiveCardJson = File.ReadAllText(filePath);
            var adaptiveCardAttachment = new Attachment()
            {
                ContentType = "application/vnd.microsoft.card.adaptive",
                Content = JsonConvert.DeserializeObject(adaptiveCardJson),
            };
            return adaptiveCardAttachment;
        }
    }
}

