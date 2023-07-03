using System.Text.Json.Serialization;
using System.Runtime.Serialization;

namespace Microsoft.Bot.Builder.M365.AI.OpenAI
{
    public enum AzureContentSafetyHarmCategory
    {
        /// <summary>
        /// Hate category.
        /// </summary>
        [EnumMember(Value = "Hate")]
        Hate,

        /// <summary>
        /// SelfHarm category.
        /// </summary>
        [EnumMember(Value = "SelfHarm")]
        SelfHarm,

        /// <summary>
        /// Sexual category.
        /// </summary>
        [EnumMember(Value = "Sexual")]
        Sexual,

        /// <summary>
        /// Violence category.
        /// </summary>
        [EnumMember(Value = "Violence")]
        Violence
    }

    public class AzureContentSafetyHarmCategoryResult
    {
        /// <summary>
        /// The text category.
        /// </summary>
        [JsonConverter(typeof(JsonStringEnumConverter))]
        [JsonPropertyName("category")]
        public AzureContentSafetyHarmCategory Category { get; set; }

        /// <summary>
        /// The higher the severity of input content, the larger this value is. The values could be: 0,2,4,6.
        /// </summary>
        [JsonPropertyName("severity")]
        public int Severity { get; set; }
    }
}
