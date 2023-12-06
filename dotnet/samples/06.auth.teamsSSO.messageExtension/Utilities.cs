using MessageExtensionAuth.Model;
using Newtonsoft.Json.Linq;
using System.Collections.Specialized;
using System.Web;

namespace MessageExtensionAuth
{
    /// <summary>
    /// Defines the activity handlers.
    /// </summary>
    public class Utilities
    {
        private readonly HttpClient _httpClient;

        public Utilities(IHttpClientFactory httpClientFactory)
        {
            _httpClient = httpClientFactory.CreateClient("WebClient");
        }


        public async Task<Package[]> SearchPackages(string text, int size, CancellationToken cancellationToken)
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
