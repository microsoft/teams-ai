using Microsoft.Bot.Builder;
using Microsoft.Bot.Schema;
using Microsoft.TeamsAI.Application;
using Microsoft.TeamsAI.State;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using System.Collections.Specialized;
using System.Web;
using TypeAheadBot.Model;

namespace TypeAheadBot
{
    /// <summary>
    /// Defines the activity handlers.
    /// </summary>
    public class ActivityHandlers
    {
        private readonly string _staticSearchCardFilePath = Path.Combine(".", "Resources", "StaticSearchCard.json");
        private readonly string _dynamicSearchCardFilePath = Path.Combine(".", "Resources", "DynamicSearchCard.json");

        private readonly HttpClient _httpClient;

        public ActivityHandlers(IHttpClientFactory httpClientFactory)
        {
            _httpClient = httpClientFactory.CreateClient("WebClient");
        }

        /// <summary>
        /// Handles members added events.
        /// </summary>
        public RouteHandler<TurnState> MembersAddedHandler => async (ITurnContext turnContext, TurnState turnState, CancellationToken cancellationToken) =>
        {
            foreach (ChannelAccount member in turnContext.Activity.MembersAdded)
            {
                if (member.Id != turnContext.Activity.Recipient.Id)
                {
                    await turnContext.SendActivityAsync("Hello and welcome! With this sample you can see the functionality of static and dynamic search in adaptive card", cancellationToken: cancellationToken);
                }
            }
        };

        /// <summary>
        /// Handles "static" message.
        /// </summary>
        public RouteHandler<TurnState> StaticMessageHandler => async (ITurnContext turnContext, TurnState turnState, CancellationToken cancellationToken) =>
        {
            Attachment attachment = CreateAdaptiveCardAttachment(_staticSearchCardFilePath);
            await turnContext.SendActivityAsync(MessageFactory.Attachment(attachment), cancellationToken);
        };

        /// <summary>
        /// Handles "dynamic" message.
        /// </summary>
        public RouteHandler<TurnState> DynamicMessageHandler => async (ITurnContext turnContext, TurnState turnState, CancellationToken cancellationToken) =>
        {
            Attachment attachment = CreateAdaptiveCardAttachment(_dynamicSearchCardFilePath);
            await turnContext.SendActivityAsync(MessageFactory.Attachment(attachment), cancellationToken);
        };

        /// <summary>
        /// Handles messages except "static" and "dynamic".
        /// </summary>
        public RouteHandler<TurnState> MessageHandler => async (ITurnContext turnContext, TurnState turnState, CancellationToken cancellationToken) =>
        {
            await turnContext.SendActivityAsync(MessageFactory.Text("Try saying \"static\" or \"dynamic\"."), cancellationToken);
        };

        /// <summary>
        /// Handles Adaptive Card dynamic search events.
        /// </summary>
        public SearchHandler<TurnState> SearchHandler => async (ITurnContext turnContext, TurnState turnState, Query<AdaptiveCardsSearchParams> query, CancellationToken cancellationToken) =>
        {
            string queryText = query.Parameters.QueryText;
            int count = query.Count;

            Package[] packages = await SearchPackages(queryText, count, cancellationToken);
            IList<AdaptiveCardsSearchResult> searchResults = packages.Select(package => new AdaptiveCardsSearchResult(package.Id!, $"{package.Id} - {package.Description}")).ToList();

            return searchResults;
        };

        /// <summary>
        /// Handles Adaptive Card Action.Submit events with verb "StaticSubmit".
        /// </summary>
        public ActionSubmitHandler<TurnState> StaticSubmitHandler => async (ITurnContext turnContext, TurnState turnState, object data, CancellationToken cancellationToken) =>
        {
            AdaptiveCardSubmitData? submitData = Cast<AdaptiveCardSubmitData>(data);
            await turnContext.SendActivityAsync(MessageFactory.Text($"Statically selected option is: {submitData!.ChoiceSelect}"), cancellationToken);
        };

        /// <summary>
        /// Handles Adaptive Card Action.Submit events with verb "DynamicSubmit".
        /// </summary>
        public ActionSubmitHandler<TurnState> DynamicSubmitHandler => async (ITurnContext turnContext, TurnState turnState, object data, CancellationToken cancellationToken) =>
        {
            AdaptiveCardSubmitData? submitData = Cast<AdaptiveCardSubmitData>(data);
            await turnContext.SendActivityAsync(MessageFactory.Text($"Dynamically selected option is: {submitData!.ChoiceSelect}"), cancellationToken);
        };

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

        private static T? Cast<T>(object data)
        {
            JObject? obj = data as JObject;
            if (obj == null)
            {
                return default;
            }
            return obj.ToObject<T>();
        }
    }
}
