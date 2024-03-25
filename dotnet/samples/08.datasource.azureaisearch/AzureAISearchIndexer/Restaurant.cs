using Azure.Search.Documents.Indexes;
using System.Text.Json;

namespace AzureAISearchIndexer
{
    public class Restaurant
    {
        [SimpleField(IsKey = true)]
        public string RestaurantId { get; set; }

        [SearchableField(IsFilterable = true, IsSortable = true)]
        public string RestaurantName { get; set; }

        [SimpleField]
        public string Description { get; set; }

        [VectorSearchField(VectorSearchDimensions = 1536, VectorSearchProfileName = "vector-search-profile")]
        public IReadOnlyList<float>? DescriptionVectorEn { get; set; } = null;

        [SearchableField(IsFilterable = true, IsSortable = true)]
        public string Category { get; set; }

        [SearchableField(IsFilterable = true)]
        public string[] Tags { get; set; }

        [SimpleField]
        public double Rating { get; set; }

        [SimpleField]
        public Address? Address { get; set; }

        public override string ToString()
        {
            return JsonSerializer.Serialize(this);
        }
    }

    public class Address
    {
        [SimpleField]
        public string StreetAddress { get; set; }

        [SimpleField]
        public string City { get; set; }

        [SimpleField]
        public string StateProvince { get; set; }

        [SimpleField]
        public string PostalCode { get; set; }

        [SimpleField]
        public string Country { get; set; }

        public override string ToString()
        {
            return JsonSerializer.Serialize(this);
        }
    }
}
