using Azure;
using Azure.Search.Documents;
using Azure.Search.Documents.Models;
using AzureAISearchIndexer;
using Microsoft.Bot.Builder;
using Microsoft.Teams.AI.AI.DataSources;
using Microsoft.Teams.AI.AI.Embeddings;
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

#pragma warning disable CS1998 // Async method lacks 'await' operators and will run synchronously
        public async Task<RenderedPromptSection<string>> RenderDataAsync(ITurnContext context, IMemory memory, ITokenizer tokenizer, int maxTokens, CancellationToken cancellationToken = default)
#pragma warning restore CS1998 // Async method lacks 'await' operators and will run synchronously
        {
            string query = (string)memory.GetValue("temp.input")!;

            if (string.IsNullOrEmpty(query))
            {
                return new RenderedPromptSection<string>("");
            }

            List<string> selectedFields = new() { "RestaurantId", "RestaurantName", "Description", "Category", "Tags", "Rating", "Address" };
            List<string> searchFields = new() { "Category", "Tags", "RestaurantName" };

            //// TEXT SEARCH ////
            //// Get the restaurants with the query has high lexical relevance to category, tags, and restaurant name.
            SearchOptions options = new();
            foreach (string field in searchFields)
            {
                options.SearchFields.Add(field);
            }

            foreach (string field in selectedFields)
            {
                options.Select.Add(field);
            }
            SearchResults<Restaurant> search = SearchClient.Search<Restaurant>(query, options);

            //// VECTOR SEARCH ////
            //// Get the restaurants with description that is the most similar to the user input.
            /*SearchOptions options = new();
            ReadOnlyMemory<float> vectorizedQuery = await this._GetEmbeddingVector(query);
            foreach (string field in selectedFields)
            {
                options.Select.Add(field);
            }
            options.VectorSearch = new()
            {
                Queries = { new VectorizedQuery(vectorizedQuery) { KNearestNeighborsCount = 3, Fields = { "DescriptionVectorEn" } } }
            };
            SearchResults<Restaurant> search = SearchClient.Search<Restaurant>(options);
            */

            //// HYBRID SEARCH ////
            //// Search using both vector and text search
            /*SearchOptions options = new();
            ReadOnlyMemory<float> vectorizedQuery = await this._GetEmbeddingVector(query);
            foreach (string field in searchFields)
            {
                options.SearchFields.Add(field);
            }

            foreach (string field in selectedFields)
            {
                options.Select.Add(field);
            }
            options.VectorSearch = new()
            {
                Queries = { new VectorizedQuery(vectorizedQuery) { KNearestNeighborsCount = 3, Fields = { "DescriptionVectorEn" } } }
            };
            SearchResults<Restaurant> search = SearchClient.Search<Restaurant>(query, options);
            */

            // Concatenate the restaurant documents (i.e json object) string into a single document
            // until the maximum token limit is reached. This can be specified in the prompt template.
            int usedTokens = tokenizer.Encode("Contexts: ").Count;
            StringBuilder doc = new StringBuilder("Contexts: ");
            Pageable<SearchResult<Restaurant>> results = search.GetResults();
            foreach (SearchResult<Restaurant> result in results)
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

#pragma warning disable IDE0051 // Remove unused private members
        private async Task<ReadOnlyMemory<float>> _GetEmbeddingVector(string query)
#pragma warning restore IDE0051 // Remove unused private members
        {
            AzureOpenAIEmbeddingsOptions options = new(this.Options.AzureOpenAIApiKey, this.Options.AzureOpenAIEmbeddingDeployment, this.Options.AzureOpenAIEndpoint);
            OpenAIEmbeddings embeddings = new(options);
            EmbeddingsResponse response = await embeddings.CreateEmbeddingsAsync(new List<string> { query });

            return response.Output!.First();
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
        /// Azure AI Search API key
        /// </summary>
        public string AzureAISearchApiKey { get; set; }

        /// <summary>
        /// Azure AI Search endpoint
        /// </summary>
        public Uri AzureAISearchEndpoint { get; set; }

        /// <summary>
        /// Azure OpenAI embeddings deployment name
        /// </summary>
        public string AzureOpenAIEmbeddingDeployment { get; set; }
    }
}
