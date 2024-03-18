using Azure;
using Azure.Search.Documents;
using Azure.Search.Documents.Models;
using AzureAISearchIndexer;
using Microsoft.Bot.Builder;
using Microsoft.Teams.AI.AI.DataSources;
using Microsoft.Teams.AI.AI.Prompts.Sections;
using Microsoft.Teams.AI.AI.Tokenizers;
using Microsoft.Teams.AI.State;
using System.Text;

namespace AzureAISearchBot
{
    public class AzureAISearchDataSource : IDataSource
    {
        public string Name { get; }

        public readonly AzureAISearchDataSourceOptions Options;

        public readonly SearchClient SearchClient;

        public AzureAISearchDataSource(AzureAISearchDataSourceOptions options)
        {
            Options = options;
            Name = options.Name;

            AzureKeyCredential credential = new AzureKeyCredential(options.AzureAISearchApiKey);
            SearchClient = new SearchClient(options.AzureAISearchEndpoint, options.IndexName, credential);
        }

        public async Task<RenderedPromptSection<string>> RenderDataAsync(ITurnContext context, IMemory memory, ITokenizer tokenizer, int maxTokens, CancellationToken cancellationToken = default)
        {
            string query = (string)memory.GetValue("temp.input")!;

            if (string.IsNullOrEmpty(query))
            {
                return new RenderedPromptSection<string>("");
            }

            List<string> selectedFields = new() { "RestaurantId", "RestaurantName", "Description", "Category", "Tags", "Rating", "Location", "Address" };
            List<string> searchFields = new() { "Category", "Tags", "RestaurantName" };
            //// Text Search ////
            // Get the restaurants with the query has high lexical relevance to category, tags, and restaurant name.
            SearchOptions options = new();
            options.SearchFields.Concat(searchFields);
            options.Select.Concat(selectedFields);
            SearchResults<Restaurant> search = SearchClient.Search<Restaurant>(query, options);

            int usedTokens = tokenizer.Encode("Context: ").Count;
            StringBuilder doc = new StringBuilder("Contexts: ");
            await foreach (SearchResult<Restaurant> result in search.GetResultsAsync())
            {
                string document = $"<context>{result.Document}</context>";
                int tokens = tokenizer.Encode(document).Count;

                if (usedTokens + tokens > maxTokens)
                {
                    break;
                }

                doc.Append(document);
                usedTokens += tokens;
            }

            return new RenderedPromptSection<string>(doc.ToString(), usedTokens, usedTokens > maxTokens);
        }
    }

    public class AzureAISearchDataSourceOptions
    {
        /// <summary>
        /// Name of the data source
        /// </summary>
        public string Name { get; set; }

        /// <summary>
        /// Name of the Azure AI Search index
        /// </summary>
        public string IndexName { get; set; }

        /// <summary>
        /// Azure OpenAI API key
        /// </summary>
        public string AzureOpenAIApiKey { get; set; }

        /// <summary>
        /// Azure OpenAI endpoint
        /// </summary>
        public string AzureOpenAIEndpoint { get; set; }

        /// <summary>
        /// Azure OpenAI Embedding deployment
        /// </summary>
        public string AzureOpenAIEmbeddingDeployment { get; set; }

        /// <summary>
        /// Azure AI Search API key
        /// </summary>
        public string AzureAISearchApiKey { get; set; }

        /// <summary>
        /// Azure AI Search endpoint
        /// </summary>
        public Uri AzureAISearchEndpoint { get; set; }
    }
}
