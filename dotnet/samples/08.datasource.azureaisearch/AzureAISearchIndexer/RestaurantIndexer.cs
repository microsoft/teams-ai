using Azure.AI.OpenAI;
using Azure;
using Azure.Search.Documents.Indexes.Models;
using Azure.Search.Documents.Indexes;
using System.Net;


namespace AzureAISearchIndexer
{
    internal class RestaurantIndexer
    {
        private string AzureAISearchKey { get; }
        private Uri AzureAISearchEndpoint { get; }
        private string AzureOpenAIKey { get; }
        private Uri AzureOpenAIEndpoint { get; }

        public RestaurantIndexer(string azureAISearchKey, Uri azureAISearchEndpoint, string azureOpenAIKey, Uri azureOpenAIEndpoint)
        {
            this.AzureAISearchKey = azureAISearchKey;
            this.AzureAISearchEndpoint = azureAISearchEndpoint;
            this.AzureOpenAIKey = azureOpenAIKey;
            this.AzureOpenAIEndpoint = azureOpenAIEndpoint;
        }

        public async Task CreateIndex()
        {
            // Create a client for manipulating search indexes
            AzureKeyCredential credential = new AzureKeyCredential(this.AzureAISearchKey);
            SearchIndexClient indexClient = new SearchIndexClient(this.AzureAISearchEndpoint, credential);
            // Create the search index
            string indexName = "restaurants";

            // Create the index if it doesn't exist
            try
            {
                indexClient.GetIndex(indexName);
            }
            catch (RequestFailedException e)
            {
                if (e.Status != (int)HttpStatusCode.NotFound)
                {
                    throw;
                }

                var response = await indexClient.CreateIndexAsync(
                    new SearchIndex(indexName)
                    {
                        Fields = new FieldBuilder().Build(typeof(Restaurant)),
                        VectorSearch = new()
                        {
                            Profiles =
                                {
                                    new VectorSearchProfile("vector-search-profile", "vector-search-algorithm")
                                },
                            Algorithms =
                                {
                                    new HnswAlgorithmConfiguration("vector-search-algorithm")
                                }
                        },
                        CorsOptions = new(new string[] { "*" })
                    }
                );

                if (response.GetRawResponse().Status != (int)HttpStatusCode.Created)
                {
                    throw new Exception("Failed to create index");
                }
            }

            // Upload documents to the index
            var searchClient = indexClient.GetSearchClient(indexName);
            var data = this.GetData();
            var uploadResponse = await searchClient.UploadDocumentsAsync(data);
            Console.WriteLine(uploadResponse.GetRawResponse().ToString());
        }

        public void DeleteIndex()
        {
            AzureKeyCredential credential = new AzureKeyCredential(this.AzureAISearchKey);
            SearchIndexClient indexClient = new SearchIndexClient(this.AzureAISearchEndpoint, credential);
            indexClient.DeleteIndex("restaurants");
        }

        public Restaurant[] GetData()
        {
            string chicFilADescription = "Chick-fil-A, Inc. is an American fast food restaurant chain and the largest chain specializing in chicken sandwiches. Headquartered in College Park, Georgia, Chick-fil-A operates 3,059 restaurants across 48 states, as well as in the District of Columbia and Puerto Rico. The company also has operations in Canada, and previously had restaurants in the United Kingdom and South Africa. The restaurant has a breakfast menu, and a lunch and dinner menu. The chain also provides catering services.";
            Restaurant chicFilaA = new()
            {
                RestaurantId = "1",
                RestaurantName = "Chick-fil-A",
                Description = chicFilADescription,
                DescriptionVectorEn = this._GetEmbeddingVector(chicFilADescription),
                Category = "Fast Food",
                Tags = new string[] { "fast food", "burgers", "fries", "shakes" },
                Rating = 4.5,
                Address = new Address
                {
                    StreetAddress = "123 Main St",
                    City = "Seattle",
                    StateProvince = "WA",
                    PostalCode = "98101",
                    Country = "USA"
                }
            };

            string starbucksDescription = "Starbucks is an American company that operates the largest coffeehouse chain and one of the most recognizable brands in the world. Headquartered in Seattle, Washington, the company operates more than 35,000 stores across 80 countries (as of 2022).";
            Restaurant starbucks = new()
            {
                RestaurantId = "2",
                RestaurantName = "Starbucks",
                Description = starbucksDescription,
                DescriptionVectorEn = this._GetEmbeddingVector(starbucksDescription),
                Category = "Coffee house",
                Tags = new string[] { "coffee", "drinks", "global", "shakes", "cafe", "tea" },
                Rating = 4.5,
                Address = new Address
                {
                    StreetAddress = "123 Main St",
                    City = "Seattle",
                    StateProvince = "WA",
                    PostalCode = "98101",
                    Country = "USA"
                }
            };

            return new Restaurant[] { chicFilaA, starbucks };
        }

        private IReadOnlyList<float> _GetEmbeddingVector(string text)
        {
            AzureKeyCredential credentials = new(this.AzureOpenAIKey);

            OpenAIClient openAIClient = new(this.AzureOpenAIEndpoint, credentials);

            EmbeddingsOptions embeddingOptions = new()
            {
                DeploymentName = "text-embedding-ada-002",
                Input = { text },
            };

            var response = openAIClient.GetEmbeddings(embeddingOptions);
            return response.Value.Data[0].Embedding.ToArray().ToList();
        }
    }
}
